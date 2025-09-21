import { App, Editor, FileSystemAdapter, MarkdownPostProcessorContext, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { transform } from './src/code';
import { Runner } from 'src/runner';
import { getDisplay } from 'src/display';
import { builtin, createRequireJs } from 'src/builtin';
import { injectStyle } from 'src/style'
import { block, Block } from 'src/block';
import { EditModal } from './src/EditModal';
import { resolve } from 'path'

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default'
}

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    injectStyle()
    await this.loadSettings();
    const runner = new Runner({
      ...builtin,
      open: async (doc: string) => {
        await this.openFileUniquely(doc);
      }
    })
    console.log(runner, this.app)
    let count = 0;
    const states = new WeakMap<HTMLElement, Block>();
    const runjs = async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      let s = states.get(el);
      if (s == null) {
        s = block(runner, `block ${count++}`, ctx.sourcePath);
        if (this.app.vault.adapter instanceof FileSystemAdapter) {
          const base = (this.app.vault.adapter as FileSystemAdapter).getBasePath()
          runner.registerBuiltin(ctx.sourcePath,{
            requireJs: createRequireJs(resolve(base, ctx.sourcePath))
          })
        }
        states.set(el, s);
        el.appendChild(s.dom);

        const controls = el.createDiv({ cls: 'plugin-runner-controls' });
        const editButton = controls.createEl('button', { text: 'Edit' });
        editButton.onclick = () => {
          const onSave = (newCode: string) => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view) {
              const section = ctx.getSectionInfo(el);
              if (section) {
                // We only want to replace the code inside the block
                view.editor.replaceRange(
                  newCode,
                  { line: section.lineStart + 1, ch: 0 },
                  { line: section.lineEnd - 1, ch: view.editor.getLine(section.lineEnd - 1).length }
                );
              }
            }
          };

          new EditModal(this.app, src, onSave).open();
        };
      }
      await s.run(src, this, ctx);
    }
    try {
      this.registerMarkdownCodeBlockProcessor("run-js", runjs);
    } catch (e) {
      new Notice('Failed to register code block processor with run-js, is it occupied by other plugin?');
    }
    try {
      this.registerMarkdownCodeBlockProcessor("exec-js", runjs);
    } catch (e) {
      new Notice('Failed to register code block processor with exec-js, is it occupied by other plugin?');
    }
  }

  onunload() {

  }

  async openFileUniquely(filePath: string, newLeaf: 'tab' | 'split' | 'window' | boolean = 'tab') {
    const activeLeaf = this.app.workspace.getLeaf();

    // 1. 遍历所有 markdown 类型的 leaf
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      // @ts-ignore
      if (leaf.view?.file?.path === filePath ||
        // @ts-ignore
        leaf.view?.state?.file === filePath
      ) {
        return
      }
    }

    await this.app.workspace.openLinkText(filePath, '', newLeaf);
    this.app.workspace.setActiveLeaf(activeLeaf)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
