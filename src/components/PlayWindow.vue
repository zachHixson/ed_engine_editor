<script setup lang="ts">
import Svg from './common/Svg.vue';

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useMainStore } from '@/stores/Main';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import Core, { Engine } from '@/core';
import { PLAY_STATE } from '@/stores/Main';
import { useI18n } from 'vue-i18n';

import xIcon from '@/assets/x.svg';
import terminalIcon from '@/assets/terminal.svg';

enum Level {
    LOG,
    WARN,
    ERROR,
    NODE_EXCEPTION,
    FATAL_EXCEPTION,
}

interface iConsoleLine {
    message: string;
    time: [string, string, string];
    level: Level;
    unread: boolean;
    exceptionData?: Core.iNodeExceptionData;
}

const emit = defineEmits(['openNodeException']);

const mainStore = useMainStore();
const logicEditorStore = useLogicEditorStore();
const { t } = useI18n();

const canvasWrapper = ref<HTMLElement>();
const canvas = ref<HTMLCanvasElement>();
const debugConsoleRef = ref<HTMLDivElement>();
const consoleOpen = ref(false);
const consoleOuput = ref(new Array<iConsoleLine>());
const fatalError = ref<boolean>(false);

let engine: Engine | null = null;
let resizeInterval: number;

const playState = computed<PLAY_STATE>({
    get(){
        return mainStore.getPlayState;
    },
    set(newState: PLAY_STATE){
        mainStore.setPlayState(newState);
    }
});
const unreadLevelClass = computed<string>(()=>{
    let unreadLevel: Level | null = null;

    if (consoleOpen.value) return '';

    consoleOuput.value.forEach(m => {
        if (!m.unread) return;

        if (unreadLevel == null || m.level > unreadLevel){
            unreadLevel = m.level;
        }
    });

    if (unreadLevel == null) return '';

    switch(unreadLevel){
        case Level.ERROR:
        case Level.NODE_EXCEPTION:
            return 'console-badge-warn';
        case Level.FATAL_EXCEPTION:
            return 'console-badge-error';
        case Level.WARN:
            return 'console-badge-warn';
        default:
            return '';
    }
});

watch(consoleOpen, ()=>{
    if (consoleOpen.value){
        consoleOuput.value.forEach(m => m.unread = false);
        dbgScrollToBottom();
    }
});

onMounted(()=>{
    start();
});

onBeforeUnmount(()=>{
    engine = null;
});

function start(): void {
    const callbackArgs = {restart};
    resizeInterval = setInterval(()=>{
        const wrapper = canvasWrapper.value as HTMLElement;
        const minDim = Math.min(wrapper.clientWidth, wrapper.clientHeight);

        Core.Draw.resizeHDPICanvas(canvas.value!, minDim, minDim);
    }, 20);
    logicEditorStore.clearAllErrors();

    if (playState.value == PLAY_STATE.DEBUGGING){
        Object.assign(callbackArgs, {
            log,
            warn,
            error,
            nodeException,
        });
    }
    else{
        Object.assign(callbackArgs, {
            nodeException: (data: Core.iNodeExceptionData)=>fatalError.value = data.fatal ?? false
        });
    }

    engine = new Engine(
        canvas.value!,
        mainStore.getSaveData(),
        callbackArgs
    );
    engine.start();
}

function close(): void {
    playState.value = PLAY_STATE.NOT_PLAYING;
    clearInterval(resizeInterval);
    engine!.stop();
}

function padNum(num: number): string {
    const padding = new Array(2).fill('0');
    const str = num.toString();

    return padding.slice(0, 2 - str.length).join('') + str;
}

function addLogMessage(textArr: string[], level: Level, exceptionData?: Core.iNodeExceptionData): void {
    const text = textArr.join(' ');
    const time = new Date();
    const h = padNum(time.getHours());
    const m = padNum(time.getMinutes());
    const s = padNum(time.getSeconds());
    
    consoleOuput.value.push({
        message: text,
        time: [h, m, s],
        level,
        unread: true,
        exceptionData,
    });

    if (consoleOuput.value.length > 150){
        consoleOuput.value.splice(0, 1);
    }

    if (consoleOpen.value){
        const listEl = debugConsoleRef.value?.querySelector('.console-message-list')!;
        const listHeight = listEl.getBoundingClientRect().height;
        
        if (listEl.scrollTop >= (listEl.scrollHeight - listHeight)){
            dbgScrollToBottom();
        }
    }
}

function log(...args: any): void {
    addLogMessage(args, Level.LOG);
}

function warn(...args: any): void {
    addLogMessage(args, Level.WARN);
}

function error(...args: any): void {
    addLogMessage(args, Level.ERROR);
}

function nodeException(data: Core.iNodeExceptionData): void {
    const msgText = data.msgVars ? t(data.msgId, data.msgVars) : t(data.msgId);
    const excLvl = data.fatal ? Level.FATAL_EXCEPTION : Level.NODE_EXCEPTION;
    const fatalErr = fatalError.value || (data.fatal ?? false);
    addLogMessage([msgText, t('editor_main.nodeExceptionClick')], excLvl, data);
    logicEditorStore.addError(data);
    fatalError.value = fatalErr;
    consoleOpen.value = fatalErr;
}

function dbgScrollToBottom(): void {
    const listEl = debugConsoleRef.value?.querySelector('.console-message-list');
    nextTick(()=>listEl?.scrollTo(0, listEl.scrollHeight));
}

function openNodeException(nodeId: number, logicId: number): void {
    close();
    emit('openNodeException', {nodeId, logicId});
}

function restart(){
    clearInterval(resizeInterval);
    engine!.stop();
    start();
};

function messageClassSelector(log: iConsoleLine): string {
    switch(log.level){
        default:
        case Level.LOG:
            return 'console-log';
        case Level.WARN:
            return 'console-warn';
        case Level.ERROR:
            return 'console-error';
        case Level.NODE_EXCEPTION:
            return 'console-exception';
        case Level.FATAL_EXCEPTION:
            return 'console-fatal-exception';
    }
}
</script>

<template>
    <div class="playWindow">
        <div class="headerBar">
            <div class="headerText">
                {{playState == PLAY_STATE.PLAYING ? $t('editor_main.run') : $t('editor_main.debug')}}
            </div>
            <button class="closeBtn" @click="close">
                <Svg style="width: 100%; height: 100%" :src="xIcon"></Svg>
            </button>
        </div>
        <div ref="canvasWrapper" class="canvasWrapper">
            <canvas ref="canvas" class="canvas">//Error loading canvas</canvas>
            <div v-if="fatalError" class="fatal-error">
                <p style="text-align: center;" v-html="playState == PLAY_STATE.DEBUGGING ? '' : t('editor_main.fatalRuntimeError')"></p>
            </div>
            <div
                v-show="playState == PLAY_STATE.DEBUGGING"
                ref="debugConsoleRef"
                class="debug-console"
                :class="consoleOpen ? 'debug-console-show':''">
                <div class="closeBtn console-button" @click="consoleOpen = !consoleOpen">
                    <div style="width: 50%; height: 90%;">
                        <Svg style="width: 100%; height: 100%" :src="terminalIcon"></Svg>
                    </div>
                    <div
                        v-if="unreadLevelClass != ''"
                        class="console-badge"
                        :class="unreadLevelClass"></div>
                </div>
                <div class="console-message-list">
                    <div
                        v-for="log in consoleOuput"
                        class="console-message"
                        :class="messageClassSelector(log)"
                        @dblclick="log.exceptionData ? openNodeException(log.exceptionData.nodeId, log.exceptionData.logicId) : null">
                        <span class="console-time">{{ `[${log.time[0]}:${log.time[1]}:${log.time[2]}]` }}</span>
                        <span class="console-text">{{ log.message }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.playWindow{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--tool-panel-bg);
}

.headerBar{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 50px;
    background: var(--heading);
    overflow: hidden;
    border: 2px solid var(--border);
    border-radius: 0 0 var(--corner-radius) var(--corner-radius);
    box-sizing: border-box;
}

.closeBtn{
    position: absolute;
    right: 3px;
    top: 3px;
    width: 40px;
    height: 40px;
    background: var(--button-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.closeBtn:hover{
    background: var(--button-hover);
}

.closeBtn:active{
    background: var(--button-down);
}

.canvasWrapper{
    position: relative;
    display: flex;
    justify-content: center;
    flex-grow: 1;
}

.canvas{
    position: absolute;
}

.fatal-error{
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
}

.debug-console{
    position: absolute;
    top: 100%;
    width: 100%;
    height: 100%;
    background: #00000055;
    transition: top 0.5s;
}

.debug-console-show{
    top: 0%;
}

.console-message-list{
    display: flex;
    flex-direction: column;
    gap: 3px;
    height: 100%;
    width: 100%;
    overflow: hidden;
    overflow-y: auto;
    box-sizing: border-box;
}

.console-time {
    opacity: 50%;
    margin-right: 5px;
}

.console-message{
    width: 100%;
    padding: 3px;
    padding-left: 0px;
    padding-right: 0px;
    padding: 5px;
}

.console-warn{
    background: #FFFF0088;
}

.console-error{
    background: #FF000088;
}

.console-exception{
    background: #FFFF0088;
    border: 2px solid black;
    border-radius: 5px;
    padding: 5px;
    box-sizing: border-box;
}

.console-fatal-exception{
    background: #FF000088;
    border: 2px solid black;
    border-radius: 5px;
    padding: 5px;
    box-sizing: border-box;
}

.console-button{
    position: absolute;
    left: 50px;
    top: -50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 50px;
    border-radius: var(--corner-radius) var(--corner-radius) 0px 0px;
    border-bottom: none;
    box-sizing: border-box;
}

.console-badge{
    position: absolute;
    right: -7px;
    top: -7px;
    width: 15px;
    height: 15px;
    border: 2px solid var(--border);
    border-radius: 50%;
}

.console-badge-error {
    background: red;
}

.console-badge-warn {
    background: orange;
}
</style>