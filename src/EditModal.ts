import { App, Modal, MarkdownView } from 'obsidian';
import van from 'vanjs-core';

// A global promise to avoid loading monaco more than once
let monacoPromise: Promise<any> | null = null;

async function loadMonaco(container: HTMLElement) {
  if (monacoPromise) {
    return monacoPromise;
  }

  monacoPromise = new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
    })
    container.append(iframe);

    const src = (
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="style-src-elem 'unsafe-inline' 'self' https://cdnjs.cloudflare.com/ajax/libs/ https://fonts.googleapis.com; script-src 'unsafe-inline' 'self' https://cdnjs.cloudflare.com/ajax/libs/; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob: https://cdnjs.cloudflare.com/ajax/libs/">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: monospace;
          }
          #editor {
            height: 100%;
            width: 100%;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/loader.js"></script>
      </head>
      <body>
        <div>Hello</div>
        <div id="editor"></div>
        <script>
fetch("https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/editor/editor.main.css")
.then(res=>res.text())
.then(css=>{
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})
</script>
        <script>
          require.config({
            'vs/css':{ disabled: true},
            paths: {
              vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs'
            }
          });

          require(['vs/editor/editor.main'], function() {
            var editor = monaco.editor.create(document.getElementById('editor'), {
              value: "",
              language: 'javascript',
              theme: ${JSON.stringify(document.body.hasClass('theme-dark') ? 'vs-dark' : 'vs')},
              automaticLayout: true,
              minimap: {
                enabled: false
              },
              fontSize: 14,
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              parameterHints: { enabled: true },
              wordWrap: 'on',
            });

            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
              target: monaco.languages.typescript.ScriptTarget.ES2020,
              allowNonTsExtensions: true,
              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
              module: monaco.languages.typescript.ModuleKind.ESNext,
              noEmit: true,
              jsx: monaco.languages.typescript.JsxEmit.React,
              allowJs: true,
              typeRoots: ["node_modules/@types"]
            });


            // Store editor reference on window for access from parent
            window.editor = editor;
          });
        </script>
      </body>
      </html>
    `
    )
    const blob = new Blob([src], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
    iframe.onload = () => {
      //@ts-ignore
      resolve(iframe.contentwindow.editor)
    }


  });

  return monacoPromise;
}


export class EditModal extends Modal {
  private code: string;
  private onSave: (newCode: string) => void;
  private editor: any;
  private iframe: HTMLIFrameElement;
  private monaco: any;
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
      this.editor = await loadMonaco(contentEl);
      this.editor.setValue(this.code)
    } catch (error) {
      contentEl.setText('Failed to load code editor. Please check your internet connection and try again.');
      console.error(error);
    }
  }

  displayEditor(contentEl: HTMLElement) {
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
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    contentEl.empty();
  }
}
