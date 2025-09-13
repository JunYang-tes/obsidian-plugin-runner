import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
	  return true
    },
  },
})
