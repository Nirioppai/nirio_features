import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/themes/mui.ts', 'src/themes/tailwind.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['firebase', /^firebase\//],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs.js' : '.esm.js' }
  },
})
