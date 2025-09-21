import van, { PropValueOrDerived } from 'vanjs-core'
import { dirname, resolve } from 'path'
const log = (...args: any[]) => {
  console.log(...args)
  // let it be shown in current container via display function
  if (args.length === 1) {
    return args[0]
  } else {
    return args
  }
}


const toKebabCase = (s: string) => s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
export function style(s: {
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

const ui = new Proxy({}, {
  get: (target, key) => {
    if (key === 'style') {
      return style
    }

    if (key === 'state' || key === 'derive' || key === 'hydrate' || key === 'add') {
      return van[key]
    } else {
      return Reflect.get(van.tags, key)
    }
  }
})

export function createRequireJs(docPath: string) {
  const dir = dirname(docPath)
  return (relativePath: string) => {
    const full = resolve(dir, relativePath)
    return require(full)
  }
}


export const builtin = {
  console: { log, error: log, warn: log, trace: log },
  id: (i: any) => i,
  ui,
}
