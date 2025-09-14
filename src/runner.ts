import { transform } from "./code";

interface CodeBlock {
  func: () => Promise<any>;
  dependencies: string[];
  provides: string[];
  display: (val: any) => void
}


export class Runner {
  codeBlocks: Map<string, CodeBlock> = new Map();
  vars: Record<string, any> = {};
  variableProvider: Map<string, string> = new Map(); // var name -> block name
  dependents: Map<string, Set<string>> = new Map(); // block name -> set of blocks that depend on it

  async run(
    src: string, name: string,
    display: (val: any) => void,
    globals: string[] = []
  ) {
    const { code, dependencies, provides } = transform(src,globals);
    const dataUri = `data:text/javascript,${encodeURIComponent(`export default ${code}`)}`;
    const { default: f } = await import(dataUri);

    // Update block
    const oldBlock = this.codeBlocks.get(name);
    if (oldBlock) {
      oldBlock.provides.forEach(p => {
        if (this.variableProvider.get(p) === name) {
          this.variableProvider.delete(p);
        }
      });
    }
    this.codeBlocks.set(name, {
      func: f.bind(this),
      dependencies,
      provides,
      display
    });
    provides.forEach(p => this.variableProvider.set(p, name));

    // Rebuild dependents graph
    this.dependents.clear();
    for (const [blockName, block] of this.codeBlocks.entries()) {
      for (const dep of block.dependencies) {
        const providerName = this.variableProvider.get(dep);
        if (providerName) {
          if (!this.dependents.has(providerName)) {
            this.dependents.set(providerName, new Set());
          }
          this.dependents.get(providerName)!.add(blockName);
        }
      }
    }

    const executeAndPropagate = async (blockName: string, path: Set<string> = new Set()) => {
      if (path.has(blockName)) {
        throw new Error(`Circular execution detected at block: ${blockName}`);
      }
      path.add(blockName);

      const block = this.codeBlocks.get(blockName);
      if (!block) {
        path.delete(blockName);
        return;
      };

      const d = (globalThis as any).display;
      (globalThis as any).display = block.display;
      await block.func();
      (globalThis as any).display = d;

      const blockDependents = this.dependents.get(blockName);
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
