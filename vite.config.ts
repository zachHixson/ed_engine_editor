import { fileURLToPath, URL } from 'node:url';
import filterReplace from 'vite-plugin-filter-replace';
import { viteSingleFile } from 'vite-plugin-singlefile';
import svgLoader from 'vite-svg-loader';

//@ts-ignore
import licenseText from './LICENSE.txt?raw';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function makeIfdef(cvar: string) {
    return [
        {
            filter: /.*/,
            replace: {
                from: `//#ifdef ${cvar}`,
                to: '/*',
            }
        },
        {
            filter: /.*/,
            replace: {
                from: `//#endif ${cvar}`,
                to: '*/',
            }
        },
    ]
}

// https://vitejs.dev/config/
export default defineConfig(({mode, command}) => {
    const isBuild = command == 'build';
    const isPortable = mode == 'portable';
    const filterReplaceArgs = [];
    const plugins = [
        vue(),
    ];
    let base = '/';

    if (isBuild){
        filterReplaceArgs.push(...[
            {
                filter: /\.html$/g,
                replace: {
                    from: '[license]',
                    to: licenseText,
                }
            },
            ...makeIfdef('IS_DEV'),
        ]);
    }
    else {
        filterReplaceArgs.push(...[
            ...makeIfdef('IS_BUILD'),
        ]);
    }

    if (isPortable){
        filterReplaceArgs.push(...[
            ...makeIfdef('IS_WEB'),
        ]);

        plugins.push(viteSingleFile({
            removeViteModuleLoader: true,
        }), svgLoader({
            defaultImport: 'raw'
        }));

        base = '.';
    }
    else {
        filterReplaceArgs.push(...[
            ...makeIfdef('IS_PORTABLE'),
        ]);
    }

    plugins.push(
        filterReplace(filterReplaceArgs, {
            enforce: 'pre'
        })
    );

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
