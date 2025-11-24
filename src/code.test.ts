import { describe, it, expect } from 'vitest';
import { transform, normalizeVariableDeclarations } from './code';

describe('transform', () => {
  it('should wrap the code in a function and add "globalVars." prefix to undeclared variables', () => {
    const sourceCode = 'const a = 1; b = a + 1; console.log(b);';
    const globals = ['console'];
    const expectedCode = `async function () {
  const a = 1;
  globalVars.b = a + 1;
  display(console.log(globalVars.b));
}`;

    const { code, dependencies, provides } = transform(sourceCode, globals);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['b']);
  });

  it('should assign function to globalVars',()=>{
		const sourceCode = 'b = 1; function a(){}'
		const expectedCode = `async function(){globalVars.b=1;display(globalVars.a=functiona(){});}`
    const { code, dependencies, provides } = transform(sourceCode, []);
    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['b', 'a']);
	})

  it('should use the custom globalVarsName', () => {
    const sourceCode = 'a = 1;';
    const globalVarsName = 'myGlobals';
    const expectedCode = `async function () {
      display(myGlobals.a = 1);
    }`;

    const { code, provides } = transform(sourceCode, [], globalVarsName);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(provides).toEqual(['a']);
  });

  it('should call display with the last expression value', () => {
    const sourceCode = 'const a = 1; a + 1';
    const expectedCode = `async function () {
  const a = 1;
  display(a + 1);
}`;

    const { code, dependencies, provides } = transform(sourceCode);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual([]);
  });

  it("should call display with the literal value", () => {
    const sourceCode = '1';
    const expectedCode = `async function () {
   display(1);
  }`
    const { code, dependencies, provides } = transform(sourceCode)
    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual([]);
  })

  it('should transform import statements to await import', () => {
    const sourceCode = `import { a, b } from 'c'; import d from 'e'; import * as f from 'g';`;
    const expectedCode = `async function() {
      const { a, b } = await import('c');
      const { default: d } = await import('e');
      const f = await import('g');
      display(undefined);
    }`;

    const { code, dependencies, provides } = transform(sourceCode);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual([]);
  });
});


describe('transform dependencies and provides', () => {
  it('should identify a simple dependency', () => {
    const sourceCode = 'const a = b;';
    const { dependencies, provides,code } = transform(sourceCode);
    expect(dependencies).toEqual(['b']);
    expect(provides).toEqual([]);
  });

  it('should identify a simple provide', () => {
    const sourceCode = 'a = 1;';
    const { dependencies, provides } = transform(sourceCode);
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['a']);
  });

  it('should identify a function provide', () => {
    const sourceCode = 'function a() {}';
    const { dependencies, provides } = transform(sourceCode);
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['a']);
  });

  it('should handle mixed dependencies and provides', () => {
    const sourceCode = 'a = b + 1; function c() { return d; }';
    const { dependencies, provides } = transform(sourceCode);
    expect(dependencies.sort()).toEqual(['b', 'd'].sort());
    expect(provides.sort()).toEqual(['a', 'c'].sort());
  });
});

describe('normalizeVariableDeclarations', () => {
  it('should remove top-level const/let and replace with assignments', () => {
    const sourceCode = `const a = 1;
let b = 2;`;
    const expectedCode = `a = 1;
b = 2;`;
    const result = normalizeVariableDeclarations(sourceCode);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });

  it('should add const to undeclared variable assignments', () => {
    const sourceCode = 'a = 1;';
    const expectedCode = 'const a = 1;';
    const result = normalizeVariableDeclarations(sourceCode);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });

  it('should handle a mix of declared and undeclared variables', () => {
    const sourceCode = `const a = 1;
b = 2;
a = 3;`;
    const expectedCode = `a = 1;
const b = 2;
a = 3;`;
    const result = normalizeVariableDeclarations(sourceCode);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });

  it('should remove top-level declarations without initializers', () => {
    const sourceCode = `let a;
const b = 2;`;
    const expectedCode = `b = 2;`;
    const result = normalizeVariableDeclarations(sourceCode);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });

  it('should not change declarations inside functions', () => {
    const sourceCode = `function myFunction() {
  const a = 1;
  let b;
}`;
    const expectedCode = `function myFunction() {
  const a = 1;
  let b;
}`;
    const result = normalizeVariableDeclarations(sourceCode);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });


  it('should preserve comments', () => {
    const sourceCode = `
// This is a declared variable
const a = 1;

// This is an undeclared variable
b = 2;`;
    const expectedCode = `
// This is a declared variable
a = 1; // This is an undeclared variable
const b = 2;
`;
    const result = normalizeVariableDeclarations(sourceCode);
    const clean = (str) => str.split('\n').map(s => s.trim()).filter(s => s).join('\n');
    //throw(clean(expectedCode)+"\n"+clean(result))
    expect(clean(result)).toBe(clean(expectedCode));
  });

  it('should handle multiple declarators in one statement', () => {
    const sourceCode = `const a = 1, b = 2;`;
    const expectedCode = `a = 1;
b = 2;`;
    const result = normalizeVariableDeclarations(sourceCode);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });
});
