<template>
    <div class="category">
        <div class="iconTitle">
            <inline-svg class="icon" :src="require(`@/${icon}.svg`)" :transformSource="removeStroke"></inline-svg>
            {{text}}
        </div>
        <button class="arrow" @click="$emit('category-clicked', {cat_ID, text, icon})">
            <inline-svg class="arrow_icon" :src="require('@/assets/arrow_01.svg')" style="transform: rotate(90deg);"
                :transformSource="removeStroke"></inline-svg>
        </button>
    </div>
</template>

<script>
import {removeStroke} from '@/common/Util.js'

export default {
    type: 'Category',
    props: ['cat_ID', 'text', 'icon'],
    methods: {
        removeStroke
    }
}
</script>

<style scoped>
.category{
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 50px;
    background: var(--heading);
    border-right: none;
    padding-left: 5px;
    margin-bottom: 3px;
    box-sizing: border-box;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.iconTitle{
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: var(--heading-font-size);
    color: var(--text-dark);
}

.icon{
    width: 30px;
    height: 30px;
    margin: 5px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.arrow{
    display: flex;
    align-items: center;
    background: var(--button-dark-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    padding: 5px;
    margin: 5px;
}

.arrow > .arrow_icon{
    width: var(--btn-arrow-width);
    height: var(--btn-arrow-height);
    stroke: var(--text-dark);
}

.arrow:hover{
    background: var(--button-dark-hover);
}

.arrow:active{
    background: var(--button-dark-down);
}
</style>