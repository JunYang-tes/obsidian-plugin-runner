const log = (...args: any[]) => {
  console.log(args)
  // let it be shown in current container via display function
  if (args.length === 1) {
    return args[0]
  } else {
    return args
  }
}

export const builtin = {
  console: { log, error: log, warn: log, trace: log },
  id: (i: any) => i
}
