import { fileURLToPath, URL } from 'node:url'
import filterReplace from 'vite-plugin-filter-replace';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VueI18nPlugin({}),
    filterReplace([
      {
        filter: /core\.ts$/g,
        replace: {
          from: "export { Engine } from '@engine/Engine'",
          to: "export { Engine } from '@compiled/Engine'"
        }
      },
      {
        filter: /core\.ts$/g,
        replace: {
          from: "import * as Core from '@engine/core/core';",
          to: "import {Core} from '@compiled/Engine'",
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
