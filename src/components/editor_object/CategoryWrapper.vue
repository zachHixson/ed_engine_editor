<script setup lang="ts">
const props = defineProps<{
    heading: string,
    iconPath: string,
}>();
</script>

<template>
    <div class="categoryWrapper">
        <div class="title">
            <img class="icon" :src="iconPath"/>
            {{heading}}
        </div>
        <div class="contents"><slot /></div>
    </div>
</template>

<style>
.categoryWrapper{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    background: var(--tool-panel-bg);
    padding: 10px;
    margin-bottom: 10px;
    border: 2px solid var(--border);
    border-radius: 10px;
}

.icon{
    width: 30px;
    height: 30px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.title{
    display: flex;
    align-items: center;
    color: var(--text-dark);
    font-weight: bold;
    font-size: 1.5em;
}

.title > *{
    margin-right: 10px;
}

.contents{
    display: flex;
    justify-content: flex-end;
    flex-grow: 1;
}
</style>