import { fileURLToPath, URL } from 'node:url'
import filterReplace from 'vite-plugin-filter-replace';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import svgLoader from 'vite-svg-loader';

//@ts-ignore
import licenseText from './LICENSE.txt?raw';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    const filterReplaceArgs = [
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
        {
            filter: /\.html$/g,
            replace: {
                from: "[license]",
                to: licenseText,
            }
        }
    ];
    const plugins = [
        vue(),
        VueI18nPlugin({}),
        filterReplace(filterReplaceArgs, {
            enforce: 'pre',
            apply: 'build',
        }),
    ];
    let base = '/';

    if (mode == 'portable'){
        plugins.push(viteSingleFile({
            removeViteModuleLoader: true,
        }), svgLoader({
            defaultImport: 'raw'
        }));

        base = '.';
    }

    return {
        plugins,
        base,
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@compiled': fileURLToPath(new URL('./_compiled', import.meta.url)),
                '@engine': fileURLToPath(new URL('./engine', import.meta.url)),
            }
        },
    }
});
