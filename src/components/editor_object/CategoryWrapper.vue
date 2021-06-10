<template>
    <div class="categoryWrapper">
        <div class="title">
            <img class="icon" :src="require(`@/${iconPath}.svg`)"/>
            {{title}}
        </div>
        <div class="contents"><slot /></div>
    </div>
</template>

<script>
export default {
    name: 'CategoryWrapper',
    props: ['title', 'iconPath']
}
</script>

<style>
.categoryWrapper{
    display: flex;
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
}
</style>