<template>
    <div class="categoryWrapper">
        <div class="title"><img class="icon" :src="require(`@/${iconPath}.svg`)" />{{title}}</div>
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
    width: 100%;
    background: rgb(201, 201, 201);
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 10px;
}

.icon{
    width: 30px;
    height: 30px;
}

.title{
    display: flex;
    align-items: center;
}

.title > *{
    margin-right: 10px;
}

.contents{
}
</style>