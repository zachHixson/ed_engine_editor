<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import Core from '@/core';
import Svg from '@/components/common/Svg.vue';
import categoryStyleMap from './categoryStyleMap';
import { useI18n } from 'vue-i18n';

import icon_magglass from '@/assets/navigation_magglass.svg';
import icon_arrow from '@/assets/arrow_01.svg';

const { t } = useI18n();

const emit = defineEmits(['node-clicked']);

const logicEditorStore = useLogicEditorStore();

const searchValue = ref<string>('');

const nodeCategories = computed(()=>{
    const categories: string[] = [];

    for (let i = 0; i < Core.NodeList.length; i++){
        const curNode = Core.NodeList[i];

        if (!categories.includes(curNode.category)){
            categories.push(curNode.category);
        }
    }

    return categories;
});
const categoryStyles = computed(()=> nodeCategories.value.map(category =>
        categoryStyleMap.get(category) ?? {name: category, color: 'var(--tool-panel-bg)', icon: icon_arrow}
    )
);
const selectedCategory = computed(()=>logicEditorStore.getOpenCategory);
const showPanel = computed(()=>selectedCategory.value != null);
const filteredNodes = computed(()=>{
    if (selectedCategory.value == 'search'){
        if (searchValue.value.trim().length > 0){
            return Core.NodeList.filter(node => node.id.includes(searchValue.value.toLowerCase()));
        }

        return Core.NodeList;
    }

    return Core.NodeList.filter(node => node.category == selectedCategory.value);
});

function tabClick(category: string): void {
    const newCategory = selectedCategory.value == category ? null : category;
    logicEditorStore.setOpenCategory(newCategory);
}
</script>

<template>
    <div class="node-library">
        <div v-if="showPanel" class="library-panel">
            <div class="library-heading">{{ t('logic_editor.' + selectedCategory) }}</div>
            <div v-if="selectedCategory == 'search'" class="search-wrapper">
                <input class="search-box" type="text" style="width: 100%" :placeholder="t('generic.search')" v-model="searchValue"/>
            </div>
            <div class="node-list">
                <div
                    v-for="node in filteredNodes"
                    class="node"
                    :style="`border-color: ${categoryStyleMap.get(node.category)?.color ?? 'var(--tool-panel-bg)'}`"
                    @click="emit('node-clicked', node.id)">
                    <div class="node-icon">
                        <Svg :src="categoryStyleMap.get(node.category)?.icon ?? ''"></Svg>
                    </div>
                    <div class="node-text">{{ t('node.' + node.id) }}</div>
                </div>
            </div>
        </div>
        <div class="tab-list">
            <div class="tab"
                :style="`
                    ${selectedCategory == 'search' ? 'width: 35px;':''}
                    border-color: #00000000;`"
                @click="tabClick('search')"
                v-tooltip="t('logic_editor.search')">
                <div v-if="selectedCategory == 'search'" class="line-erase"></div>
                <Svg class="tab-icon" :src="icon_magglass"></Svg>
            </div>
            <div
                v-for="category in categoryStyles"
                :style="`
                    border-color: ${category.color};
                    ${selectedCategory == category.name ? 'width: 35px':''}
                `"
                class="tab"
                @click="tabClick(category.name)"
                v-tooltip="t('logic_editor.' + category.name)">
                <div v-if="selectedCategory == category.name" class="line-erase"></div>
                <Svg class="tab-icon" :src="category.icon" :style="category.icon == icon_arrow ? 'rotate: 90deg;':''"></Svg>
            </div>
        </div>
    </div>
</template>

<style scoped>
.node-library{
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    z-index: 10;
}

.library-panel{
    display: flex;
    flex-direction: column;
    width: 220px;
    height: 95%;
    padding: 10px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    overflow: hidden;
    z-index: 1000;
}

.library-heading{
    padding-bottom: 10px;
    font-weight: bold;
    font-size: 1.5em;
}

.search-wrapper{
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    width: 100%;
    margin-bottom: 10px;
    box-sizing: border-box;
}

.search-box{
    height: 25px;
    border-radius: 4px;
    border: 1px solid grey;
}

.node-list{
    display: flex;
    flex-direction: column;
    gap: 5px;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
}

.node{
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;
    height: 25px;
    padding: 10px;
    background: var(--tool-panel-bg);
    border-top: 8px solid red;
    border-radius: var(--corner-radius);
    outline: 2px solid var(--border);
    outline-offset: -2px;
}

.node:hover{
    filter: brightness(1.2);
    outline-color: #999999;
}

.node:active{
    filter: brightness(0.8);
}

.node-icon{
    width: 20px;
    height: auto;
    margin-right: 10px;
    flex-shrink: 0;
    box-sizing: border-box;
}

.node-text{
    width: 100%;
    word-wrap: break-word;
}

.tab-list{
    display: flex;
    flex-direction: column;
    max-height: 90%;
    gap: 10px;
}

.tab{
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 35px;
    height: 70px;
    background: var(--tool-panel-bg);
    border-right: 5px solid var(--border);
    z-index: 1000;
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    outline: 2px solid var(--border);
    box-sizing: border-box;
}

.tab-icon{
    padding: 2px;
}

.line-erase{
    position: absolute;
    left: -2px;
    height: 100%;
    width: 3px;
    background: var(--tool-panel-bg);
}
</style>