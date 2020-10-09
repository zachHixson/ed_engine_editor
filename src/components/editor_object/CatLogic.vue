<template>
    <div class="catLogic">
        <div class="control">
            <label for="drawing_select">Logic Type: </label>
            <select id="drawing_select">
                <option value="preset">Preset</option>
                <option value="custom">Custom</option>
            </select>
        </div>
        <div class="control">
            <label for="drawing_select">Logic Preset: </label>
            <select id="drawing_select"></select>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CatLogic'
}
</script>

<style scoped>
.catLogic{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.control{
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 3px;
}

input:not([type="checkbox"]), select{
    box-sizing: border-box;
    width: 150px;
}
</style>