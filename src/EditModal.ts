import { App, Modal, MarkdownView } from 'obsidian';
import van from 'vanjs-core';

// A global promise to avoid loading monaco more than once
let monaco: any;

async function loadMonaco() {
  if (monaco) {
    return monaco;
  }
  monaco = await import('https://cdn.jsdelivr.net/npm/monaco-editor@0.53.0/+esm');
  return monaco;
}


export class EditModal extends Modal {
  private code: string;
  private onSave: (newCode: string) => void;
  // @ts-ignore
  private editor: monaco.editor.IStandaloneCodeEditor;
  private closable = false;

  constructor(app: App, code: string, onSave: (newCode: string) => void) {
    super(app);
    this.code = code;
    this.onSave = onSave;
    Object.assign(
      this.modalEl.style,
      {
        height: '80vh',
        width: '80vw',
        display: 'grid',
        gridTemplateRows: 'auto minmax(100px,1fr) auto',
        gridTemplateColumns: 'minmax(100px,1fr)',
      }
    )
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('plugin-runner-edit-modal');

    this.titleEl.setText('Edit Code');
    this.modalEl.querySelector('.modal-close-button')
      ?.addEventListener('click', () => {
        super.close()
      })

    try {
      const monaco = await loadMonaco();
      this.displayEditor(contentEl, monaco);
    } catch (error) {
      contentEl.setText('Failed to load code editor. Please check your internet connection and try again.');
      console.error(error);
    }
  }

  displayEditor(contentEl: HTMLElement, monaco: any) {
    Object.assign(contentEl.style, {
      display: 'flex',
      flexDirection: 'column',
    })
    const editorContainer = contentEl.createDiv({ cls: 'editor-container' });
    Object.assign(editorContainer.style, {
      border: '1px solid #ccc',
      flexGrow: 1,
      overflow: 'auto',
    })

    //@ts-ignore
    this.editor = monaco.editor.create(editorContainer, {
      value: this.code,
      language: 'javascript',
      theme: document.body.hasClass('theme-dark') ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: {
        enabled: false
      },
      fontSize: 14,
      wordWrap: 'on',
    });

    const saveButton = this.modalEl.createEl('button', { text: 'Save' });
    saveButton.onclick = () => {
      const newCode = this.editor.getValue();
      this.onSave(newCode);
      this.closable = true;
      super.close();
    };
  }

  close() {
  }

  onClose() {
    const { contentEl } = this;
    if (this.editor) {
      this.editor.dispose();
    }
    contentEl.empty();
  }
}
