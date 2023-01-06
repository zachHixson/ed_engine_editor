<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { ref, nextTick, computed, onMounted } from 'vue';
import { useMainStore, PLAY_STATE } from '@/stores/Main';
import { useI18n } from 'vue-i18n';
import renameIcon from '@/assets/rename.svg';
import packageIcon from '@/assets/package.svg';
import debugIcon from '@/assets/debug.svg';
import playIcon from '@/assets/play.svg';

const mainStore = useMainStore();
const { t } = useI18n();

let enumID = 0;

const fileVisible = ref<boolean>(false);
const isRenaming = ref<boolean>(false);
const displayEditBox = ref<HTMLElement>();
const projNameEdit = ref<HTMLInputElement>();
const fileOpen = ref<HTMLElement>();
const choices = [
    {
        id: enumID++,
        text: t('file_menu.new'),
        method: getMenuAction(newProject),
    },
    {
        id: enumID++,
        text: t('file_menu.open'),
        method: getMenuAction(open),
    },
    {
        id: enumID++,
        text: t('file_menu.save'),
        method: getMenuAction(save),
    },
    {
        id: enumID++,
        text: t('file_menu.export'),
        method: getMenuAction(packageGame),
    },
    {
        id: enumID++,
        text: t('file_menu.prefs'),
        method: getMenuAction(() => {console.log("Preferences")}),
    },
    {
        id: enumID++,
        text: t('file_menu.about'),
        method: getMenuAction(() => {console.log("About")}),
    }
];

const emit = defineEmits(['new-project', 'save-project', 'open-project', 'package-game']);

const projName = computed({
    get(): string {
        return mainStore.getProjectName;
    },
    set(newName: string): void {
        mainStore.setProjectName(newName);
    }
});

const playState = computed({
    get(): PLAY_STATE {
        return mainStore.getPlayState;
    },
    set(state: PLAY_STATE): void {
        mainStore.setPlayState(state);
    }
})

onMounted(()=>{
    document.addEventListener('keypress', (event) => {
        if (isRenaming.value && event.key == 'Enter'){
            isRenaming.value = false;
        }
    });

    displayEditBox.value?.addEventListener('dblclick', rename);
});

function closeFileMenu(): void {
    fileVisible.value = false;
}

function rename(): void {
    isRenaming.value = true;
    nextTick(()=>{
        projNameEdit.value?.focus();
        projNameEdit.value?.select();
    });
}

function stopRenaming(): void {
    isRenaming.value = false;
}

function getMenuAction(callback: ()=>void): (e: MouseEvent)=>void {
    return (event: MouseEvent) => {
        event.stopPropagation();
        closeFileMenu();
        callback();
    }
}

function newProject(): void {
    emit('new-project');
}

function save(): void {
    emit('save-project');
}

function open(): void {
    fileOpen.value?.click();
}

const loadProjectFile = (event: Event): void => {
    let input = event.target as HTMLInputElement;

    if (!input.files){
        return;
    }

    if ('files' in input && input.files.length > 0){
        let reader = new FileReader();
        reader.onload = () => {
            emit('open-project', reader.result);
        }
        reader.readAsText(input.files[0]);
    }
}

function packageGame(): void {
    emit('package-game');
}

</script>

<template>
    <div class="headerPanel">
        <button class="fileMenu" @click="(event)=>{event.stopPropagation(); fileVisible = !fileVisible}"
            v-click-outside="closeFileMenu">
            Ed
            <div ref="dropDown" class="dropDown" v-show="fileVisible">
                <button
                    v-for="choice in choices"
                    :key="choice.id"
                    @click="choice.method"
                    class="choice">{{choice.text}}</button>
            </div>
        </button>
        <div class="projNameBox">
            <div class="projTitle">{{$t('editor_main.project_name')}}</div>
            <div ref="displayEditBox" class="displayEditBox" v-click-outside="stopRenaming">
                <div v-show="!isRenaming" ref="projNameDisplay" class="projNameDisplay">{{projName}}</div>
                <input v-show="isRenaming" ref="projNameEdit" type="text" class="projNameEdit" v-model="projName" v-input-active/>
                <button class="renameBtn" @click="isRenaming ? stopRenaming() : rename()"><Svg class="renameBtnImg" :src="renameIcon"></Svg></button>
            </div>
        </div>
        <div class="controls">
            <button class="iconBtn" name="packageBtn" @click="packageGame" v-tooltip="$t('editor_main.package')"><Svg class="icon" :src="packageIcon"></Svg></button>
            <button class="iconBtn" name="debugBtn" @click="playState = PLAY_STATE.DEBUGGING" v-tooltip="$t('editor_main.debug')"><Svg class="icon" :src="debugIcon"></Svg></button>
            <button class="iconBtn" name="runBtn" @click="playState = PLAY_STATE.PLAYING" v-tooltip="$t('editor_main.run')"><Svg class="icon" :src="playIcon"></Svg></button>
        </div>
        <input type="file" ref="fileOpen" style="display: none" accept=".html, .edproj" @change="loadProjectFile"/>
    </div>
</template>

<style scoped>
.headerPanel{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.fileMenu{
    position: relative;
    flex-shrink: 0;
    width: 70px;
    height: 70px;
    background: none;
    border: 2px solid black;
    border-left: none;
    border-top: none;
    border-radius: 0px 0px var(--corner-radius) 0px;
    font-size: 2em;
    color: var(--button-icon);
    background: var(--button-norm);
}

.fileMenu:hover{
    background: var(--button-hover);
}

.fileMenu:active{
    background: var(--button-down);
}

.dropDown{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: white;
    top: 20px;
    left: 100%;
    z-index: 1000;
}

.choice{
    display: flex;
    justify-content: flex-start;
    background: none;
    border: none;
    border-bottom: 1px solid black;
    width: 10vw;
    text-align: left;
    padding: 10px;
}

.choice:hover{
    background: #DDDDFF;
}

.choice:last-child{
    border: none;
}

.projNameBox{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.projTitle{
    font-size: 1.5em;
    font-weight: bold;
    color: var(--text-dark);
}

.displayEditBox{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.projNameDisplay{
    max-width: 8em;
    width: 8em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 10px;
}

.projNameEdit{
    max-width: 9em;
}

.renameBtn{
    display: flex;
    justify-content: center;
    align-items: center;
    background: none;
    border: none;
}

.renameBtnImg{
    width: 30px;
    height: 30px;
}

.controls{
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
}

.iconBtn{
    --size: 50px;
    display: flex;
    width: var(--size);
    height: var(--size);
    background: var(--button-norm);
    margin: 5px;
    justify-content: center;
    align-items: center;
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    fill: var(--button-icon);
    stroke: var(--button-icon);
}

.iconBtn:hover{
    background: var(--button-hover);
}

.iconBtn:active{
    background: var(--button-down);
}

.icon{
    width: 100%;
    height: 100%;
}
</style>