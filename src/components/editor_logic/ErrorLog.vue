<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { ref, computed, watch } from 'vue';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import { useI18n } from 'vue-i18n';

import xIcon from '@/assets/x.svg';
import errorIcon from '@/assets/error_decorator.svg';
import warningIcon from '@/assets/warning_decorator.svg';

const emit = defineEmits(['open-node-exception']);

const { t } = useI18n();
const logicEditorStore = useLogicEditorStore();

const errorListOpened = ref<boolean>(false);

const showErrorLog = computed<boolean>(()=>logicEditorStore.errors.length > 0);
const errorCount = computed<number>(()=>logicEditorStore.errors.filter(l => l.fatal).length);
const warningCount = computed<number>(()=>logicEditorStore.errors.filter(l => !l.fatal).length);

watch(showErrorLog, ()=>{
    if (showErrorLog.value == false){
        errorListOpened.value = false;
    }
});

function toggleErrorList(): void {
    errorListOpened.value = !errorListOpened.value;
}

function openNodeException(nodeId: number, logicId: number): void {
    emit('open-node-exception', {nodeId, logicId});
}

</script>

<template>
    <div class="ErrorLog" :class="!showErrorLog ? 'ErrorLog-Hidden' :''">
        <div class="notif-wrapper btn" @click="toggleErrorList()">
            <div class="section">
                <Svg class="decorator" :src="errorIcon"></Svg> Errors: <span class="num-count">{{ errorCount }}</span>
            </div>
            <div style="width: 1px; height: 60%; background: grey;"></div>
            <div class="section">
                <Svg class="decorator" :src="warningIcon"></Svg> Warnings: <span class="num-count">{{ warningCount }}</span>
            </div>
        </div>
        <div
            class="section clear-btn"
            v-tooltip="t('logic_editor.clear_all_errors')"
            @click="logicEditorStore.clearAllErrors()">
            <Svg :src="xIcon" style="width: 15px; height: 15px;"></Svg>
        </div>
        <Transition name="error-list">
            <div
                v-if="errorListOpened"
                class="error-list">
                <div
                    v-for="error in logicEditorStore.errors"
                    :key="error.errorId"
                    class="error">
                        <div class="log btn" @click="openNodeException(error.nodeId, error.logicId)">
                            <div class="icon"><Svg class="decorator" :src="error.fatal ? errorIcon : warningIcon"></Svg></div>
                            <div class="msg">{{ t(error.msgId) }}</div>
                        </div>
                        <div class="clear clear-btn" @click="logicEditorStore.clearError(error.errorId)" v-tooltip="t('logic_editor.clear_error')">
                            <Svg :src="xIcon" style="width: 15px; height: 15px;"></Svg>
                        </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>

.ErrorLog {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    transition: top 0.2s ease-in-out;
}

.ErrorLog-Hidden {
    top: -100px;
}

.notif-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-right: 1px solid black;
    border-radius: 10px 0px 0px 10px;
}

.btn:hover {
    background: #ffffff;
}

.btn:active {
    background: #d6d6d6;
}

.clear-btn {
    border-radius: 0px 8px 8px 0px;
}

.clear-btn:hover {
    background: rgb(255, 70, 70);
}

.clear-btn:active {
    background: rgb(219, 44, 44);
}

.section {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 5px;
}

.decorator {
    width: 20px;
    padding-right: 5px;
}

.num-count {
    margin-left: 5px;
    font-weight: bold;
}

.error-list {
    position: absolute;
    top: 115%;
    left: 50%;
    width: 90%;
    height: 200px;
    transform: translateX(-50%);
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    box-sizing: border-box;
    overflow: hidden;
    overflow-y: auto;
}

.error-list-enter-active,
.error-list-leave-active {
    transition: height 0.2s ease-in-out;
}

.error-list-enter-from,
.error-list-leave-to {
    height: 0px;
}

.error {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
    border-bottom: 1px solid black;
}

.error > .log {
    display: flex;
    flex-direction: row;
    align-items: center;
    overflow-x: hidden;
    text-wrap: nowrap;
    width: 100%;
    border-right: 1px solid grey;
}

.error > .log > .icon {
    height: 20px;
    padding-left: 5px;
}

.error > .clear {
    height: min-content;
    text-align: center;
    padding: 5px;
    border-radius: 0;
}

</style>