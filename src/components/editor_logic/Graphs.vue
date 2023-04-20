<script setup lang="ts">
import DragList, { type iChangeEventProps } from '@/components/common/DragList.vue';
import Svg from '@/components/common/Svg.vue';

import { ref, computed, nextTick } from 'vue';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import type Logic from './node_components/Logic';

import plusIcon from '@/assets/plus.svg';
import renameIcon from '@/assets/rename.svg';
import trashIcon from '@/assets/trash.svg';

const logicEditorStore = useLogicEditorStore();

const props = defineProps<{
    selectedAsset: Logic;
}>();

const emit = defineEmits(['graph-switched']);

const graphListRef = ref<HTMLDivElement>();
const graphRenameRefs: Map<number, HTMLInputElement> = new Map();
const renamingGraph = ref<number | null>(null);

const graphs = computed(()=>props.selectedAsset.graphs);

function addGraph(): void {
    props.selectedAsset.addGraph();

    nextTick(()=>{
        const graphList = graphListRef.value!;

        if (graphList){
            graphList.scrollTop = graphList.scrollHeight - graphList.clientHeight;
        }
    });
}

function startRenamingGraph(id: number): void {
    renamingGraph.value = id;
    nextTick(()=>{
        const box = graphRenameRefs.get(id)!;
        box.focus();
        box.select();
    });
}

function stopRenamingGraph(): void {
    renamingGraph.value = null;
}

function deleteGraph(event: MouseEvent, graphId: number): void {
    event.stopPropagation();
    props.selectedAsset.deleteGraph(graphId);
}

function graphOrderChanged(event: iChangeEventProps): void {
    const {itemIdx, newIdx} = event;
    const movedGraph = props.selectedAsset.graphs[itemIdx];
    const shiftForward = itemIdx > newIdx;
    const compFunc: (i: number)=>boolean = shiftForward ? i => i > newIdx : i => i < newIdx;
    const dir = shiftForward ? -1 : 1;

    for (let i = itemIdx; compFunc(i); i += dir){
        props.selectedAsset.graphs[i] = props.selectedAsset.graphs[i + dir];
    }

    props.selectedAsset.graphs[newIdx] = movedGraph;
}
</script>

<template>
    <div v-show="logicEditorStore.isGraphPanelOpen" class="side-panel graph-list-library">
        <div class="side-panel-heading">
            <div>{{$t('logic_editor.graph_panel_heading')}}</div>
            <button class="add-graph-btn" @click="addGraph">
                <Svg :src="plusIcon"></Svg>
            </button>
        </div>
        <div ref="graphListRef" class="graph-list">
            <DragList
                @order-changed="graphOrderChanged">
                <div
                    v-for="graph in graphs"
                    class="graph"
                    :class="selectedAsset.selectedGraphId == graph.id ? 'graph-selected' : ''"
                    @click="emit('graph-switched', graph.id)"
                    v-click-outside="stopRenamingGraph">
                    <div class="graph-name">
                        <div
                            v-show="renamingGraph != graph.id"
                            class="graph-display-name"
                            @dblclick="startRenamingGraph(graph.id)">
                                {{graph.name}}
                            </div>
                        <div v-show="renamingGraph == graph.id">
                            <input
                                :ref="el => graphRenameRefs.set(graph.id, el as HTMLInputElement)"
                                style="width: 90%" type="text"
                                v-model="graph.name" v-input-active
                                @keyup.enter="stopRenamingGraph"/>
                        </div>
                    </div>
                    <div class="graph-controls">
                        <button class="graph-control-btn" @click="startRenamingGraph(graph.id)">
                            <Svg style="width: 30px; height: auto;" :src="renameIcon"></Svg>
                        </button>
                        <button class="graph-control-btn" @click="deleteGraph($event, graph.id)">
                            <Svg style="width: 20px; height: auto;" :src="trashIcon"></Svg>
                        </button>
                    </div>
                </div>
            </DragList>
        </div>
    </div>
</template>

<style scoped>
.graph-list-library{
    min-width: 200px;
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.add-graph-btn{
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--button-dark-norm);
    width: 25px;
    height: 25px;
    border: 2px solid var(--border);
    border-radius: 5px;
}

.add-graph-btn > *{
    width: 25px;
    height: 25px;
}

.add-graph-btn:hover{
    background: var(--button-dark-hover);
}

.add-graph-btn:active{
    background: var(--button-dark-down);
}

.graph-list{
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: 5px;
    overflow: hidden;
    overflow-y: auto;
}

.graph{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    border: 2px solid gray;
    margin: 5px;
    margin-top: 0;
    box-sizing: border-box;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    background: var(--tool-panel-bg);
}

.graph-selected{
    background: var(--selection);
}

.graph-name{
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin-left: 5px;
}

.graph-display-name{
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 7em;
    height: auto;
}

.graph-controls{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.graph-control-btn{
    display: flex;
    flex-direction: row;
    justify-content: center;
    background: none;
    border: none;
}
</style>