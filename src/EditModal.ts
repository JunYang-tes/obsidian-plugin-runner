import { App, Modal, MarkdownView } from 'obsidian';

const buildinDts = `
interface State<T> {
 val: T
 readonly oldVal: T
 readonly rawVal: T
}

// Defining readonly view of State<T> for covariance.
// Basically we want StateView<string> to implement StateView<string | number>
type StateView<T> = Readonly<State<T>>

type Val<T> = State<T> | T

 type Primitive = string | number | boolean | bigint

 type PropValue = Primitive | ((e: any) => void) | null

 type PropValueOrDerived = PropValue | StateView<PropValue> | (() => PropValue)

 type Props = Record<string, PropValueOrDerived> & { class?: PropValueOrDerived; is?: string }

 type PropsWithKnownKeys<ElementType> = Partial<{[K in keyof ElementType]: PropValueOrDerived}>

 type ValidChildDomValue = Primitive | Node | null | undefined

 type BindingFunc = ((dom?: Node) => ValidChildDomValue) | ((dom?: Element) => Element)


 type ChildDom = ValidChildDomValue | StateView<Primitive | null | undefined> | BindingFunc | readonly ChildDom[]

 type TagFunc<Result> = (first?: Props & PropsWithKnownKeys<Result> | ChildDom, ...rest: readonly ChildDom[]) => Result

type Tags = Readonly<Record<string, TagFunc<Element>>> & {
  [K in keyof HTMLElementTagNameMap]: TagFunc<HTMLElementTagNameMap[K]>
}

 function state<T>(): State<T>
 function state<T>(initVal: T): State<T>

 interface Van {
  readonly state: typeof state
  readonly derive: <T>(f: () => T) => State<T>
  readonly add: (dom: Element | DocumentFragment, ...children: readonly ChildDom[]) => Element
  readonly tags: Tags & ((namespaceURI: string) => Readonly<Record<string, TagFunc<Element>>>)
  readonly hydrate: <T extends Node>(dom: T, f: (dom: T) => T | null | undefined) => T
}
type UI = Tags & {
  style: (s: { [k in keyof CSSStyleDeclaration]?: PropValueOrDerived })=> string
  state: Van['state']
  derive: Van['derive']
  hydrate: Van['hydrate']
}
declare const ui: UI
declare function notice(msg: string): void
declare function id<T>(i: T): T
declare function requireJs(path: string): any
declare function open(doc: string): Promise<void>
declare function getVaultPath(): string
`

async function loadMonaco(container: HTMLElement) {

  return new Promise<{editor: any, monaco: any}>((resolve, reject) => {
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
            monaco.languages.typescript.javascriptDefaults.addExtraLib(${JSON.stringify(buildinDts)},'buildin.d.ts');

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
            window.monaco = monaco;
          });
        </script>
      </body>
      </html>
    `
    )
    const blob = new Blob([src], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
    iframe.onload = () => {
      resolve({
        //@ts-ignore
        editor: iframe.contentWindow.editor,
        //@ts-ignore
        monaco: iframe.contentWindow.monaco,
      })
    }
  });
}


export class EditModal extends Modal {
  private code: string;
  private onSave: (newCode: string) => void;
  private editor: any;
  private iframe: HTMLIFrameElement;
  private monaco: any;
  private closable = false;

  constructor(app: App, code: string, onSave: (newCode: string) => void,
    private extralibs: Array<{name: string, code: string}>
  ) {
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
      const { editor, monaco } = await loadMonaco(contentEl);
      this.editor = editor
      this.editor.setValue(this.code)
            monaco.languages.typescript.javascriptDefaults.addExtraLib(`
                                                                       test = 1;
                                                                       function add(
                                                                         /** @type {number} */
                                                                         a,
                                                                         /** @type {number} */
                                                                         b) {
                                                                         return a+b
                                                                       }

                                                                       `,'1.js');
      this.extralibs.forEach(({name,code})=>{
        monaco.languages.typescript.javascriptDefaults.addExtraLib(code,name);
      })
      const saveButton = this.modalEl.createEl('button', { text: 'Save' });
      saveButton.onclick = () => {
        const newCode = this.editor.getValue();
        this.onSave(newCode);
        this.closable = true;
        super.close();
      };
    } catch (error) {
      contentEl.setText('Failed to load code editor. Please check your internet connection and try again.');
      console.error(error);
    }
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
