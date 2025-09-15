import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { transform } from './src/code';
import { Runner } from 'src/runner';
import { getDisplay } from 'src/display';
import { builtin } from 'src/builtin';
import { injectStyle } from 'src/style'
import { block, Block } from 'src/block';

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
    const globals = [
      ...Object.keys(globalThis)
    ].filter(i => i !== 'console');

    const runner = new Runner(builtin)
    let count = 0;
    const states = new WeakMap<HTMLElement, Block>();


    this.registerMarkdownCodeBlockProcessor("run-js", (src, el, ctx) => {
      let s = states.get(el);
      if (s == null) {
        s = block(runner, `block ${count++}`);
        states.set(el,s)
        el.appendChild(s.dom)
      }
      s.run(src, this, ctx);
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

