<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Svg from './common/Svg.vue';

import { useI18n } from 'vue-i18n';

import xIcon from '@/assets/x.svg';
import throbberIcon from '@/assets/throbber.svg';

const emit = defineEmits([
    'demo-opened',
]);

const { t } = useI18n();

const isPortable = location.hostname == '';
const hideToggle = ref<boolean>(localStorage.getItem('hide-welcome') == 't' && !isPortable);
const showModal = ref(!(hideToggle.value || isPortable));
const showWelcome = ref(false);
const showDemos = ref(false);
const loadingDemo = ref(false);
const loadingDemoError = ref(false);
const welcomeText = ref<string>('');
const demoNames = ref<string[]>([]);

onMounted(()=>{
    if (showModal.value){
        showWelcome.value = true;

        fetch('./welcome_text.html')
            .then(res => {
                if (!res.ok){
                    console.error('Could not load welcome text');
                    return '<h1 style="text-align: center">Welcome!</h1>';
                }

                return res.text();
            })
            .then(text => welcomeText.value = text);
    }
});

function openModal(): void {
    showModal.value = true;
    showWelcome.value = true;
}

function closeModal(): void {
    localStorage.setItem('hide-welcome', hideToggle.value ? 't' : 'f');
    showModal.value = false;
    showWelcome.value = false;
    showDemos.value = false;
}

function switchToDemos(): void {
    localStorage.setItem('hide-welcome', hideToggle.value ? 't' : 'f');
    showWelcome.value = false;
    showDemos.value = true;
    loadingDemo.value = true;

    fetch('./_demos/manifest.txt')
        .then(res => {
            if (!res.ok){
                loadingDemoError.value = true;
                loadingDemo.value = true;
                return null;
            }

            return res.text();
        })
        .then(manifest => {
            if (!manifest) return;

            const names = manifest.split('\n');
            demoNames.value = names;

            loadingDemo.value = false;
        });
}

function openDemo(demo: string): void {
    const path = `./_demos/${demo}.edproj`;

    loadingDemo.value = true;

    fetch(path)
        .then(res => {
            if (!res.ok){
                loadingDemoError.value = true;
                loadingDemo.value = true;
                return null;
            }

            return res.text();
        })
        .then(fileContents => {
            if (!fileContents) return;

            loadingDemo.value = false;
            closeModal();
            emit('demo-opened', fileContents);
        });
}

function clickOutside(): void {
    if (loadingDemo.value) return;
    closeModal();
}

defineExpose({openModal});

</script>

<template>
    <div class="welcomeModal">
        <div class="background" :class="showModal ? 'bg-show' : ''">
            <Transition name="Twindow">
                <div v-if="showWelcome" class="window" v-click-outside="clickOutside">
                    <div class="text" v-html="welcomeText"></div>
                    <div class="controls">
                        <button @click="switchToDemos">{{ t('welcome_modal.explore_demos') }}</button>
                        <button class="get-started-btn" @click="closeModal">{{ t('welcome_modal.get_started') }}</button>
                    </div>
                    <div class="hide">
                        <input id="hide-welcome" type="checkbox" v-model="hideToggle"/>
                        <label for="hide-welcome">{{ t('welcome_modal.hide_welcome') }}</label>
                    </div>
                </div>
            </Transition>
            <Transition name="Twindow">
                <div v-if="showDemos" class="window" v-click-outside="clickOutside">
                    <div style="display: flex; flex-direction: row; justify-content: end;">
                        <button style="width: 25px; height: 25px;" @click="closeModal">
                            <Svg style="width: 100%; height: 100%" :src="xIcon"></Svg>
                        </button>
                    </div>
                    <div v-if="!loadingDemo" class="demo-list">
                        <button
                            v-for="demo in demoNames"
                            class="demo-btn"
                            @click="openDemo(demo)" >
                                <img :src="`./_demos/${demo}.svg`" style="width: 75px; height: 75px;" />
                                <p>{{ t(`welcome_modal.demo_${demo}`) }}</p>
                        </button>
                    </div>
                    <div v-show="loadingDemo" class="throbber-wrapper">
                        <Svg v-show="!loadingDemoError" :src="throbberIcon" class="throbber"></Svg>
                        <div v-show="loadingDemoError">{{ t('welcome_modal.demo_error') }}</div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.welcomeModal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    pointer-events: none;
}

.background {
    position: relative;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.0);
    transition: background-color 0.3s;
    pointer-events: none;
}

.bg-show {
    pointer-events: all;
    background: rgba(0, 0, 0, 0.5);
}

.window{
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: top left;
    transform: translate(-50%, -50%) scale(100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    gap: 5px;
    background: white;
    width: 400px;
    height: 300px;
    padding: 10px;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    overflow: hidden;
}

.window > .text {
    height: 100%;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    overflow: hidden;
    overflow-y: auto;
}

.window > .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
}

.window > .controls > button {
    width: 80%;
    border: none;
    border-radius: 5px;
    font-size: x-large;
    padding: 5px;
}

.get-started-btn {
    background: #51ce51;
    color: white;
}

.get-started-btn:hover {
    background: #43b443;
}

.get-started-btn:active {
    background: rgb(45, 117, 45);
}

.demo-list{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    gap: 5px;
    height: 100%;
}

.demo-btn {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

.throbber-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.throbber {
    animation: rotation 1s infinite linear;
}

label {
    font-size: small;
    color: grey;
}

.Twindow-enter-from,
.Twindow-leave-to {
    transform: scale(1%);
}
</style>