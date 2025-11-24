import { parse } from '@babel/parser';
import traverse, { Scope } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

type ParseResult = ReturnType<typeof parse>;

export function transform(src: string, globals: string[] = [], globalVarsName = 'globalVars') {
  const ast = parse(src, { sourceType: 'module' });
  const allGlobals = [...globals, globalVarsName];

  traverse(ast, {
    ReferencedIdentifier(path) {
      if (t.isIdentifier(path.node) && isUndeclaredVariable(path.scope, path.node.name, allGlobals)) {
        path.replaceWith(t.memberExpression(t.identifier(globalVarsName), path.node));
      }
    },
    AssignmentExpression(path) {
      if (t.isIdentifier(path.node.left) && isUndeclaredVariable(path.scope, path.node.left.name, allGlobals)) {
        path.get('left').replaceWith(t.memberExpression(t.identifier(globalVarsName), path.node.left));
      }
    },
    FunctionDeclaration(path) {
      if (path.parent.type === 'Program') {
        const functionName = path.node.id;
        if (functionName) {
          const functionExpression = t.functionExpression(
            functionName,
            path.node.params,
            path.node.body,
            path.node.generator,
            path.node.async
          );

          const assignment = t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.memberExpression(t.identifier(globalVarsName), functionName),
              functionExpression
            )
          );
          path.replaceWith(assignment);
        }
      }
    },
    ImportDeclaration(path) {
      const specifiers = path.node.specifiers;
      const source = path.node.source;

      const awaitImport = t.awaitExpression(t.callExpression(t.import(), [source]));

      if (specifiers.length === 0) {
        path.replaceWith(t.expressionStatement(awaitImport));
        return;
      }

      const declarators = specifiers.map(specifier => {
        if (t.isImportSpecifier(specifier)) {
          return t.objectProperty(specifier.imported, specifier.local, false,true);
        } else if (t.isImportDefaultSpecifier(specifier)) {
          return t.objectProperty(t.identifier('default'), specifier.local);
        } else { // ImportNamespaceSpecifier
          return t.variableDeclarator(specifier.local, awaitImport);
        }
      });

      if (specifiers.some(s => t.isImportNamespaceSpecifier(s))) {
        path.replaceWith(t.variableDeclaration('const', declarators.filter(d => t.isVariableDeclarator(d))));
      } else {
        const pattern = t.objectPattern(declarators.filter(d => t.isObjectProperty(d)));
        path.replaceWith(t.variableDeclaration('const', [t.variableDeclarator(pattern, awaitImport)]));
      }
    }
  });

  const dependencies = new Set<string>();
  const provides = new Set<string>();

  traverse(ast, {
    MemberExpression(path) {
      if (
        t.isIdentifier(path.node.object) &&
        path.node.object.name === globalVarsName
      ) {
        const property = path.node.property as t.Identifier;
        const propertyName = property.name;

        if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node) {
          provides.add(propertyName);
        } else {
						if(!provides.has(propertyName)) {
								dependencies.add(propertyName);
						}
				}
      }
    }
  });

  const body = ast.program.body;
  const lastStatement = body[body.length - 1];

  if (t.isExpressionStatement(lastStatement)) {
    body[body.length - 1] = t.expressionStatement(t.callExpression(t.identifier('display'), [lastStatement.expression]));
  } else {
    body.push(t.expressionStatement(t.callExpression(t.identifier('display'), [t.identifier('undefined')])));
  }

  const functionExpression = t.functionExpression(null, [], t.blockStatement(body), false, true);

  return {
    code: generate(functionExpression).code,
    dependencies: [...dependencies],
    provides: [...provides]
  };
}

export function isUndeclaredVariable(
	scope: Scope,
	variableName: string, globals: string[] = []) {
  return !scope.hasBinding(variableName) && !globals.includes(variableName);
}

export function normalizeVariableDeclarations(src: string, globals: string[] = []) {
  const ast = parse(src, {
    sourceType: 'module',
    attachComment: true
  });

  const topLevelDeclaredNames = new Set<string>();

  // Pass 1: Collect all bindings declared at the top level.
  traverse(ast, {
    Program(path) {
      Object.keys(path.scope.bindings).forEach(name => {
        topLevelDeclaredNames.add(name);
      });
      path.stop(); // We only want the top-level scope, so we stop traversal immediately.
    }
  });

  const assignmentsToConvert: any[] = [];
  const declarationsToConvert: any[] = [];

  // Pass 2: Collect paths for mutations, without changing the AST.
  traverse(ast, {
    AssignmentExpression(path) {
      if (t.isIdentifier(path.node.left)) {
        const varName = path.node.left.name;
        if (!topLevelDeclaredNames.has(varName) && isUndeclaredVariable(path.scope, varName, globals)) {
          if (path.parent.type === 'ExpressionStatement') {
            assignmentsToConvert.push(path.parentPath);
          }
        }
      }
    },
    VariableDeclaration(path) {
      if (path.parent.type === 'Program') {
        declarationsToConvert.push(path);
      }
    }
  });

  // Pass 3: Perform mutations, starting from the end to avoid path invalidation issues.
  const allPaths = [...assignmentsToConvert, ...declarationsToConvert].sort((a, b) => b.node.start - a.node.start);

  for (const path of allPaths) {
    if (path.isVariableDeclaration()) {
      const assignments = path.node.declarations
        .filter(declarator => declarator.init)
        .map(declarator => t.expressionStatement(t.assignmentExpression('=', declarator.id, declarator.init!)));

      if (assignments.length > 0) {
        assignments[0].leadingComments = path.node.leadingComments;
        path.replaceWithMultiple(assignments);
      } else {
        path.remove();
      }
    } else if (path.isExpressionStatement() && t.isAssignmentExpression(path.node.expression)) {
      const newDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(path.node.expression.left, path.node.expression.right)
      ]);
      newDeclaration.leadingComments = path.node.leadingComments;
      newDeclaration.trailingComments = path.node.trailingComments;
      newDeclaration.innerComments = path.node.innerComments;
      path.replaceWith(newDeclaration);
    }
  }

  return generate(ast, { comments: true }).code;
}
