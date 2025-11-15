import { fileURLToPath, URL } from 'node:url';
import filterReplace from 'vite-plugin-filter-replace';
import { viteSingleFile } from 'vite-plugin-singlefile';
import svgLoader from 'vite-svg-loader';

//@ts-ignore
import licenseText from './LICENSE.txt?raw';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

type FilterArg = {
    filter: string | RegExp,
    replace: {
        from: string,
        to: string,
    },
};

class IfDef {
    private static _defines = new Array<string>();

    static new(name: string, condition: boolean): void {
        if (!condition) {
            this._defines.push(name);
        }
    }

    static getFilterArgs(): Array<FilterArg> {
        const filter = /.*/;
        const filterArgs = new Array<FilterArg>(this._defines.length * 2);

        for (let i = 0; i < filterArgs.length; i += 2) {
            const define = this._defines[i];

            filterArgs[i] = {
                filter,
                replace: {
                    from: `//#ifdef ${define}`,
                    to: '/*',
                }
            };
            filterArgs[i + 1] = {
                filter,
                replace: {
                    from: `//#endif ${define}`,
                    to: '*/',
                }
            }
        }

        return filterArgs;
    }
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

    IfDef.new('IS_DEV', command == 'serve');
    IfDef.new('IS_BUILD', isBuild);
    IfDef.new('IS_PORTABLE', isPortable);
    IfDef.new('IS_WEB', !isPortable);

    if (isBuild){
        filterReplaceArgs.push(...[
            {
                filter: /\.html$/g,
                replace: {
                    from: '[license]',
                    to: licenseText,
                }
            },
        ]);
    }

    if (isPortable){
        plugins.push(viteSingleFile({
            removeViteModuleLoader: true,
        }), svgLoader({
            defaultImport: 'raw'
        }));

        base = '.';
    }

    filterReplaceArgs.push(...IfDef.getFilterArgs());

    plugins.push(
        filterReplace(filterReplaceArgs, {
            enforce: 'pre'
        }),
        
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
