import van from 'vanjs-core'
const log = (...args: any[]) => {
  console.log(args)
  // let it be shown in current container via display function
  if (args.length === 1) {
    return args[0]
  } else {
    return args
  }
}

const ui = new Proxy({}, {
  get: (target, key) => {
    if (key === 'state' || key === 'derive' || key === 'hydrate' || key === 'add') {
      return van[key]
    } else {
      return Reflect.get(van.tags, key)
    }
  }
})

export const builtin = {
  console: { log, error: log, warn: log, trace: log },
  id: (i: any) => i,
  ui,
}
