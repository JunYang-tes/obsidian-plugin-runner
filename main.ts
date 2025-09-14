import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { transform } from './src/code';
import { Runner } from 'src/runner';
import { getDisplay } from 'src/display';

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
    await this.loadSettings();
    const globals = [
      ...Object.keys(globalThis)];
    const runner = new Runner()
    let count = 0;
    const states = new WeakMap<HTMLElement, { name: string, display: (val: any) => void }>();

    this.registerMarkdownCodeBlockProcessor("run-js", (src, el, ctx) => {
      let s = states.get(el);
      if (s == null) {
        const root = el.createEl("div");
        const disEl = root.createEl("div");
        const display = getDisplay(disEl);
        const name = `block ${count++}`;
        states.set(el, { name, display });
        runner.run(src, name, display,globals)
          .catch(display)
      } else {
        const { name, display } = s
        runner.run(src, name, display,globals)
          .catch(display)
      }
    })
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

