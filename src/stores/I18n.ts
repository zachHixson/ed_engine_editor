import { defineStore } from 'pinia';

//always import EN language in order to have a default/fallback
import en from '@/locales/en.json?raw';
import en_nodes from '@/locales/en_node_doc.json?raw';

//#ifdef IS_PORTABLE
const LANG_MAP: {[key: string]: Lang} = {
    'en': {
        lang: en,
        node: en_nodes,
    }
}
//#endif IS_PORTABLE

const DEFAULT_LANG_CODE = 'en';
const DEFAULT_LANG_TEXT = JSON.parse(en);
const DEFAULT_NODE_TEXT = JSON.parse(en_nodes);

type Lang = {
    lang: string,
    node: string,
}

type ParsedLang = {
    [key: string]: {
        [key: string]: string
    }
}

interface iState {
    langCode: string,
    langText: ParsedLang,
    nodeText: ParsedLang,
}

//#ifdef IS_WEB
    function fetchJSON(path: string, callback: (langObj: ParsedLang)=>void): void {
        fetch(path)
            .then(res => {
                if (!res.ok){
                    console.error('Could not load lang JSON', path);
                    return '';
                }

                return res.text();
            })
            .then(text => {
                callback(JSON.parse(text));
            });
    }
//#endif IS_WEB

export const useI18nStore = defineStore({
    id: 'i18n',

    state: (): iState => ({
        langCode: DEFAULT_LANG_CODE,
        langText: DEFAULT_LANG_TEXT,
        nodeText: DEFAULT_NODE_TEXT,
    }),

    getters: {
        t: (state): (key: string, replaceObj?: Record<string, unknown>)=>string => {
            return (key, replaceObj) => {
                const split = key.split('.');

                if (split.length < 2){
                    console.error(`Could not parse translation key: ${key}`);
                    return key;
                }

                const category = state.langText[split[0]] || DEFAULT_LANG_TEXT[split[0]];

                if (category == undefined){
                    //#ifdef IS_DEV
                        console.error(`Could not find category "${split[0]}" in either set or default locale files`);
                        return key;
                    //#endif IS_DEV

                    //#ifdef IS_BUILD
                        return '';
                    //#endif IS_BUILD
                }

                let text = category[split[1]] || DEFAULT_LANG_TEXT[split[0]][split[1]];

                if (text == undefined){
                    //#ifdef IS_DEV
                        console.error(`Could not find translation key "${key}" in either set or default locale files`);
                        return key;
                    //#endif IS_DEV

                    //#ifdef IS_BUILD
                        return '';
                    //#endif IS_BUILD
                }

                if (replaceObj){
                    for (let i in replaceObj){
                        text = text.replace(`{${i}}`, replaceObj[i] as string);
                    }
                }

                return text;
            };
        },
        te: (state): (key: string)=>string => {
            return (key) => {
                const split = key.split('.');
                const category = state.langText[split[0]] || DEFAULT_LANG_TEXT[split[0]];
                const text = category[split[1]] || DEFAULT_LANG_TEXT[split[0]][split[1]];
                return category && text;
            }
        },
        getNodeDoc: (state): (nodeTemplateId: string)=>{[key: string]: string} => {
            return (nodeTempalteId: string) => {
                const nodeInfo = state.nodeText[nodeTempalteId] || DEFAULT_NODE_TEXT[nodeTempalteId];

                if (nodeInfo == undefined){
                    throw new Error(`Could not find nodeTemplateId "${nodeTempalteId}" in either set or default locale files`);
                }

                return nodeInfo;
            }
        }
    },

    actions: {
        initLang(langCode: string = DEFAULT_LANG_CODE){
            //avoid unecessary reinitialization if the lang hasn't changed
            if (this.langCode == langCode){
                return;
            }

            let langPath: string;
            let nodePath: string;

            this.langCode = langCode;

            langPath = `/${this.langCode}.json`;
            nodePath = `/${this.langCode}_node_doc.json`;

            //#ifdef IS_DEV
                const i18nDir = './src/i18n/locales';
                langPath = i18nDir + langPath;
                nodePath = i18nDir + nodePath;
            //#endif IS_DEV

            //#ifdef IS_WEB
                fetchJSON(langPath, langObj=>this.langText = langObj);
                fetchJSON(nodePath, langObj=>this.nodeText = langObj);
            //#endif IS_WEB

            //#ifdef IS_PORTABLE
                const langObj = LANG_MAP[this.langCode];

                if (langObj){
                    this.langText = JSON.parse(langObj.lang);
                    this.nodeText = JSON.parse(langObj.node);
                }
            //#endif IS_PORTABLE
        }
    }
});