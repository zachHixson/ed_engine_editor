import { defineStore } from 'pinia';

//always import EN language in order to have a default/fallback
import en from '@/locales/en.json?raw';
import en_nodes from '@/locales/en_node_doc.json?raw';

type Lang = {
    lang: string,
    node: string,
}

type ParsedLang = {
    [key: string]: string | ParsedLang
}

type ParsedNodeDoc = {
    [key: string]: {
        [key: string]: string
    }
}

interface iState {
    langCode: string,
    langText: ParsedLang,
    nodeText: ParsedNodeDoc,
}

//#ifdef IS_PORTABLE
const LANG_MAP: {[key: string]: Lang} = {
    'en': {
        lang: en,
        node: en_nodes,
    }
}
//#endif IS_PORTABLE

const DEFAULT_LANG_CODE = 'en';
const DEFAULT_LANG_TEXT: ParsedLang = JSON.parse(en);
const DEFAULT_NODE_TEXT: ParsedNodeDoc = JSON.parse(en_nodes);

//#ifdef IS_WEB
    function fetchJSON(path: string, callback: (langObj: any)=>void): void {
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

function traverseLangTree(keys: string[], sourceLang: ParsedLang, index: number): string | undefined {
    const key = keys[index];

    if (!key) {
        return undefined;
    }

    const foundValue = sourceLang[key];

    if (!foundValue) {
        return undefined;
    }

    if (typeof foundValue == 'object') {
        return traverseLangTree(keys, foundValue, index + 1);
    }

    return foundValue;
}

export const useI18nStore = defineStore('i18n', {
    state: (): iState => ({
        langCode: DEFAULT_LANG_CODE,
        langText: DEFAULT_LANG_TEXT,
        nodeText: DEFAULT_NODE_TEXT,
    }),

    getters: {
        t: (state): (key: string, replaceObj?: Record<string, unknown>)=>string => {
            return (key, replaceObj) => {
                const split = key.split('.');
                let langResult = traverseLangTree(split, state.langText, 0);

                if (!langResult) {
                    langResult = traverseLangTree(split, DEFAULT_LANG_TEXT, 0);
                }

                if (!langResult) {
                    console.warn(`Could not find translation key [${key}] in lang '${state.langCode}' or default locale files`);
                    return '';
                }

                if (replaceObj){
                    for (let i in replaceObj){
                        langResult = langResult.replace(`{${i}}`, replaceObj[i] as string);
                    }
                }

                return langResult;
            };
        },
        te: (state): (key: string)=>boolean => {
            return (key) => {
                const split = key.split('.');
                let langResult = traverseLangTree(split, state.langText, 0);

                if (!langResult) {
                    langResult = traverseLangTree(split, DEFAULT_LANG_TEXT, 0);
                }

                return !!langResult;
            }
        },
        getNodeDoc: (state): (nodeTemplateId: string)=>{[key: string]: string} => {
            return (nodeTempalteId: string) => {
                const nodeInfo = state.nodeText[nodeTempalteId] || DEFAULT_NODE_TEXT[nodeTempalteId];

                if (nodeInfo == undefined){
                    throw new Error(`Could not find nodeTemplateId "${nodeTempalteId}" in lang or default locale files`);
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
