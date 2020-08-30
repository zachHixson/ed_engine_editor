<template>
    <div class="category">
        <div class="iconTitle">
            <img class="icon" :src="require(`@/${icon}.svg`)" />
            {{text}}
        </div>
        <button class="arrow" @click="$emit('category-clicked', {cat_ID, text, icon})">&gt;</button>
    </div>
</template>

<script>
export default {
    type: 'Category',
    props: ['cat_ID', 'text', 'icon']
}
</script>

<style scoped>
.category{
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 50px;
    background: #AAAAFF;
    border: 1px solid black;
    box-sizing: border-box;
}

.iconTitle{
    display: flex;
    align-items: center;
}

.icon{
    width: 20px;
    height: 20px;
    margin: 5px;
}

.arrow{
    background: none;
    border: 1px solid black;
    padding: 5px;
    margin: 5px;
}

.arrow:hover{
    background: #5555FF;
}

.arrow:active{
    background: #2222FF;
}
</style>