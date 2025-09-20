import van, { PropValueOrDerived } from 'vanjs-core'
import { Runner } from './runner'
import { getDisplay } from './display'
import { MarkdownPostProcessorContext, MarkdownRenderer, Plugin } from 'obsidian'
import { style } from './builtin'

export type Block = ReturnType<typeof block>
export function block(runner: Runner, name: string, doc: string) {
  const codeExpanded = van.state(false)
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
  const dom = div(
    {
      "data-name": "Block Container",
      style: style({
        display: 'flex',
        border: '1px solid #ccc',
        borderRadius: '4px',
        flexDirection: 'column',
        gap: '10px'
      })
    },
    srcDom,
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
    run(src: string, plugin: Plugin, ctx: MarkdownPostProcessorContext
    ) {
      MarkdownRenderer.render(plugin.app, `\`\`\`js\n${src}\n\`\`\``, srcDom, ctx.sourcePath, plugin)
      return runner
        .run(src, name, doc, display,Object.keys(globalThis))
        .catch(display)
    }
  }
}
