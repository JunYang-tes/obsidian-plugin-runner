import { App, Editor, MarkdownPostProcessorContext, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { transform } from './src/code';
import { Runner } from 'src/runner';
import { getDisplay } from 'src/display';
import { builtin } from 'src/builtin';
import { injectStyle } from 'src/style'
import { block, Block } from 'src/block';
import { EditModal } from './src/EditModal';

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
    const runner = new Runner(builtin)
    console.log(runner)
    let count = 0;
    const states = new WeakMap<HTMLElement, Block>();
    const runjs = (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      let s = states.get(el);
      if (s == null) {
        s = block(runner, `block ${count++}`, ctx.sourcePath);
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
      s.run(src, this, ctx);

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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

