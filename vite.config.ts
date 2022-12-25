import { fileURLToPath, URL } from 'node:url'
import filterReplace from 'vite-plugin-filter-replace';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    filterReplace([
      {
        filter: "core.ts",
        replace: {
          from: "export { Engine } from '@engine/Engine'",
          to: "export { Engine } from '@compiled/Engine'"
        }
      },
      {
        filter: "core.ts",
        replace: {
          from: "import * as Core from '@engine/core/core_filemap';",
          to: "import {Core} from '@engine/Engine'",
        },
      },
    ],
    {
      enforce: 'pre',
      apply: 'build',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@compiled': fileURLToPath(new URL('./_compiled', import.meta.url)),
      '@engine': fileURLToPath(new URL('./engine', import.meta.url)),
    }
  }
})
