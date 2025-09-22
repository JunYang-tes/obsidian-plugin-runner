import van, { PropValueOrDerived } from 'vanjs-core'
import { Runner } from './runner'
import { getDisplay } from './display'
import { App, MarkdownPostProcessorContext, MarkdownRenderer, MarkdownView, Plugin } from 'obsidian'
import { style } from './builtin'
import { EditModal } from './EditModal'

export type Block = ReturnType<typeof block>
export function block(runner: Runner, name: string, ctx: MarkdownPostProcessorContext, plugin: Plugin, root: HTMLElement) {
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

  const run = (src: string) => {
    currentSrc = src;
    srcDom.innerHTML = '';
    MarkdownRenderer.render(plugin.app, `\`\`\`js\n${src}\n\`\`\``, srcDom, ctx.sourcePath, plugin)
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

            new EditModal(plugin.app, currentSrc, onSave).open();
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
    run,
  }
}
