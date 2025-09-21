//@ts-ignore
import { Inspector } from '@observablehq/inspector'

export function getDisplay(container: HTMLElement) {
  const inspector = new Inspector(container);
  return (val: any) => { 
    if(val instanceof HTMLElement) {
      container.innerHTML = ""
      container.appendChild(val)
    } else if(val instanceof Promise) {
      val.then(v => {
        inspector.fulfilled(v);
      })
      .catch(e=>inspector.fulfilled(e))
    } else {
      inspector.fulfilled(val);
    }
  }
}
