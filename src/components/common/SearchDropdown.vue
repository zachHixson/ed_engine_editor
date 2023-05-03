<script setup lang="ts">
import Svg from './Svg.vue';
import VueCanvas from './VueCanvas.vue';

import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import arrowIcon from '@/assets/arrow_01.svg';

const { t } = useI18n();

const props = withDefaults(defineProps<{
    items: Array<{
        name: string,
        id: number | string,
        value: any,
        thumbnail?: ImageData,
    }>;
    value?: any;
    thumbnail?: boolean;
    search?: boolean;
}>(), {
    thumbnail: false,
    search: false,
});

const emit = defineEmits(['change']);

const boxEl = ref<HTMLDivElement>();
const searchEl = ref<HTMLInputElement>();
const dropdownEl = ref<HTMLDivElement>();

const selectedId = ref<number | string>(-1);
const open = ref(false);
const searchQuery = ref<string>('');

const selected = computed<any>(()=>props.items.find(i => i.id == selectedId.value) ?? (props.items[0] ? props.items[0] : null));
const filteredItems = computed(()=>searchQuery.value.length ? props.items.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase())) : props.items);

onMounted(()=>{
    if (props.value){
        selectedId.value = props.items.find(i => i.value == props.value)?.id ?? -1;
    }
});

function setOpen(value: boolean): void {
    open.value = value;

    if (open.value){
        nextTick(()=>{
            const { left, bottom } = boxEl.value!.getBoundingClientRect();
            dropdownEl.value!.style.left = left + 'px';
            dropdownEl.value!.style.top = bottom + 'px';
            dropdownEl.value!.style.width = boxEl.value!.clientWidth + 'px';
            searchEl.value!.focus();
        });
    }
}

function updateSearchQuery(e: Event): void {
    const event = e as InputEvent;
    const target = event.target as HTMLInputElement;
    searchQuery.value = target.value;
}

function selectItem(item: typeof props.items[number]): void {
    selectedId.value = item.id;
    emit('change', item);
    open.value = false;
}
</script>

<template>
    <div class="search-dropdown" ref="boxEl" @click="setOpen(true)">
        <div v-if="selected" class="selected-text">{{ selected.name }}</div>
        <Teleport to="#global-dest">
            <div v-if="open" ref="dropdownEl" class="dropdown-box" v-click-outside.lazy="()=>setOpen(false)">
                <div class="search-wrapper">
                    <input ref="searchEl" class="search" type="text" :placeholder="t('generic.search')" @input="updateSearchQuery"/>
                </div>
                <div class="dropdown-list">
                    <div
                        v-for="item in filteredItems"
                        :key="item.id"
                        class="dropdown-item"
                        @click="selectItem(item)">
                        <div v-if="thumbnail && item.thumbnail" class="dropdown-thumbnail">
                            <VueCanvas width="32" height="32" class="thumbnail-canvas" :image-data="item.thumbnail"></VueCanvas>
                        </div>
                        <div class="dropdown-name">{{ item.name }}</div>
                    </div>
                </div>
            </div>
        </Teleport>
        <div class="dropdown-arrow">
            <Svg :src="arrowIcon"></Svg>
        </div>
    </div>
</template>

<style scoped>
.search-dropdown{
    position: relative;
    width: 100px;
    height: 30px;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    background: #FCFCFC;
    box-sizing: border-box;
}

.search-dropdown:hover{
    border-color:rgb(0, 201, 201);
}

.selected-text{
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    padding: 5px;
    box-sizing: border-box;
}

.dropdown-box{
    position: absolute;
    top: 0px;
    left: 0px;
    display: flex;
    flex-direction: column;
    width: 100px;
    z-index: 1000;
    pointer-events: all;
    user-select: none;
    filter: drop-shadow(1px 1px 2px #00000055);
}

.search-wrapper{
    background: #FCFCFC;
    padding: 0px 3px 0px 3px;
    padding-bottom: none;
    border-radius: 5px 5px 0px 0px;
    overflow: hidden;
    box-sizing: border-box;
}

.search{
    width: 100%;
    height: 25px;
    background: #f1f1f1;
    border: 2px solid gray;
    border-radius: 5px;
    box-sizing: border-box;
    margin-top: 5px;
    overflow: hidden;
}

.search:focus{
    outline: none;
}

.dropdown-list{
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    max-height: 200px;
    padding: 5px;
    padding-left: 0px;
    padding-right: 0px;
    background: #FCFCFC;
    border-radius: 0px 0px 3px 3px;
    box-sizing: border-box;
    overflow: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
}

.dropdown-item{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
    height: 32px;
    padding: 5px;
    box-sizing: border-box;
}

.dropdown-item:hover{
    background: #EEEEEE;
}

.dropdown-arrow{
    position: absolute;
    width: 15px;
    height: 15px;
    right: 3px;
    top: 50%;
    transform: translateY(-50%) rotate(180deg);
}

.thumbnail-canvas{
    display: block;
    width: 32px;
    height: 32px;
}
</style>