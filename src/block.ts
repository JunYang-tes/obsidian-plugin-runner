import van, { PropValueOrDerived } from 'vanjs-core'
import { Runner } from './runner'
import { getDisplay } from './display'
import { MarkdownPostProcessorContext, MarkdownRenderer, Plugin } from 'obsidian'

const toKebabCase = (s: string) => s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
function style(s: {
  [k in keyof CSSStyleDeclaration]?: PropValueOrDerived
}) {
  if (Object.values(s).every(v => typeof v === 'string')) {
    return Object.entries(s).map(([k, v]) => `${toKebabCase(k)}:${v}`).join(';')
  }

  return () => {
    return Object.entries(s).map(([k, v]) => {
      if (typeof v === 'function') {
        return [k, v()] as const
      }
      if (typeof v === 'object' && v) {
        return [k, v.val] as const
      }
      return [k, v] as const
    })
      .map(([k, v]) => `${toKebabCase(k)}:${v}`)
      .join(';')
  }
}

export type Block = ReturnType<typeof block>
export function block(runner: Runner, name: string) {
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
    disEl
  )
  return {
    dom,
    run(src: string, plugin: Plugin, ctx: MarkdownPostProcessorContext
    ) {
      MarkdownRenderer.render(plugin.app, `\`\`\`js\n${src}\n\`\`\``, srcDom, ctx.sourcePath, plugin)
      runner
        .run(src, name, display)
        .catch(display)
    }
  }
}
