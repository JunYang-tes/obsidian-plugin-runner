import { transform } from "./code";

interface CodeBlock {
  func: () => Promise<any>;
  dependencies: string[];
  provides: string[];
  display: (val: any) => void
}

interface DocState {
  codeBlocks: Map<string, CodeBlock>;
  vars: Record<string, any>;
  variableProvider: Map<string, string>;
  dependents: Map<string, Set<string>>;
  globalVarsName: string;
}

export class Runner {
  private docStates: Map<string, DocState> = new Map();
  private initialVars: Record<string, any>;

  constructor(vars: Record<string, any> = {}) {
    this.initialVars = vars;
  }

  private getOrInitDocState(doc: string): DocState {
    if (!this.docStates.has(doc)) {
      const globalVarsName = '__g' + Math.random().toString(36).slice(2);
      const vars = {
        ...this.initialVars,
        load: async (doc: string) => {
          await this.initialVars.open(doc);
          const vars = this.getOrInitDocState(doc).vars
          return vars
        }
      };
      (globalThis as any)[globalVarsName] = vars;

      this.docStates.set(doc, {
        codeBlocks: new Map(),
        vars: vars,
        variableProvider: new Map(),
        dependents: new Map(),
        globalVarsName: globalVarsName,
      });
    }
    return this.docStates.get(doc)!;
  }

  public registerBuiltin(doc: string, vars: any) {
    const state = this.getOrInitDocState(doc);
    Object.assign(state.vars, vars)
  }

  async run(
    src: string, name: string, doc: string,
    display: (val: any) => void,
    globals: string[] = []
  ) {
    const {
      codeBlocks,
      variableProvider,
      dependents,
      globalVarsName
    } = this.getOrInitDocState(doc);

    const { code, dependencies, provides } = transform(src, globals, globalVarsName);
    const dataUri = `data:text/javascript,${encodeURIComponent(`export default ${code}`)}`;
    const { default: f } = await import(dataUri);

    // Update block
    const oldBlock = codeBlocks.get(name);
    if (oldBlock) {
      oldBlock.provides.forEach(p => {
        if (variableProvider.get(p) === name) {
          variableProvider.delete(p);
        }
      });
    }
    codeBlocks.set(name, {
      func: f,
      dependencies,
      provides,
      display
    });
    provides.forEach(p => variableProvider.set(p, name));

    // Rebuild dependents graph
    dependents.clear();
    for (const [blockName, block] of codeBlocks.entries()) {
      for (const dep of block.dependencies) {
        const providerName = variableProvider.get(dep);
        if (providerName) {
          if (!dependents.has(providerName)) {
            dependents.set(providerName, new Set());
          }
          dependents.get(providerName)!.add(blockName);
        }
      }
    }

    const executeAndPropagate = async (blockName: string, path: Set<string> = new Set()) => {
      if (path.has(blockName)) {
        throw new Error(`Circular execution detected at block: ${blockName}`);
      }
      path.add(blockName);

      const block = codeBlocks.get(blockName);
      if (!block) {
        path.delete(blockName);
        return;
      };

      const d = (globalThis as any).display;
      (globalThis as any).display = block.display;
      await block.func();
      (globalThis as any).display = d;

      const blockDependents = dependents.get(blockName);
      if (blockDependents) {
        for (const dependentName of blockDependents) {
          await executeAndPropagate(dependentName, path);
        }
      }

      path.delete(blockName);
    };

    await executeAndPropagate(name);
  }
}
