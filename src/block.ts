import van, { PropValueOrDerived } from 'vanjs-core'
import { Runner } from './runner'
import { getDisplay } from './display'
import { App, MarkdownPostProcessorContext, MarkdownRenderer, MarkdownView, Plugin } from 'obsidian'
import { style } from './builtin'
import { EditModal } from './EditModal'
import { normalizeVariableDeclarations } from './code'

export type Block = {
  dom: HTMLElement
  getCode: () => string
  run: (src: string) => Promise<void>
}
export function block(runner: Runner, name: string, ctx: MarkdownPostProcessorContext, plugin: Plugin,
  root: HTMLElement,
  blocks: Block[]
) {
  const doc = ctx.sourcePath;
  const codeExpanded = van.state(true)
  const { div, button } = van.tags
  const disEl = div()
  const display = getDisplay(disEl);
  const srcDom = div(
    {
      style: style({
        maxHeight: '300px',
        overflow: 'auto',
        display: () => codeExpanded.val ? 'none' : 'block',
      })
    },
  )
  let currentSrc = ""
  const { style: vanStyle } = van.tags;
  const loading = div(
    {
      style: style({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '20px',
        minHeight: '50px',
      })
    },
    vanStyle(`
      .loader {
        border: 4px solid #f3f3f3; /* Light grey */
        border-top: 4px solid var(--interactive-accent, #4884f1); /* Blue */
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `),
    div({ class: 'loader' }),
    div('Loading...')
  );

  const run = (src: string) => {
    currentSrc = src;
    srcDom.innerHTML = '';
    try {
      MarkdownRenderer.render(plugin.app, `\`\`\`js\n${src}\n\`\`\``, srcDom, ctx.sourcePath, plugin)
    } catch (e) {
      console.error(e)
    }
    display(loading)
    return runner
      .run(src, name, doc, display, Object.keys(globalThis))
      .catch(display)
  }
  const dom = div(
    {
      "data-name": "Block Container",
      style: style({
        display: 'flex',
        border: '1px solid #ccc',
        borderRadius: '4px',
        flexDirection: 'column',
        padding: '10px',
        gap: '10px'
      })
    },
    srcDom,
    div(
      {
        style: style({
          display: 'flex',
          gap: '10px'
        }),
      },
      button({ onclick: () => codeExpanded.val = (!codeExpanded.val) },
        () => codeExpanded.val ? 'Show Source' : 'Hide Source',
      ),
      button(
        {
          onclick: () => {
            const onSave = (newCode: string) => {
              const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
              if (view) {
                const section = ctx.getSectionInfo(root);
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
            console.log(blocks)

            new EditModal(plugin.app, currentSrc, onSave,
              blocks.map((b, i) => ({ name: `block_${i}`, code: normalizeVariableDeclarations(b.getCode()) }))
            ).open();
          }
        },
        'Edit'
      ),
      button(
        {
          onclick: () => {
            run(currentSrc,)
          }
        },
        'Rerun',
      )
    ),
    van.tags.hr(),
    div(
      {
        "data-name": "Block Display",
        style: style({
          padding: '0 10px 10px 10px'
        })
      },
      disEl
    )
  )
  return {
    dom,
    getCode() {
      return currentSrc
    },
    run,
  }
}
