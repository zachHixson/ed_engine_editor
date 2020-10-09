<template>
    <div class="catDrawing">
        <div class="options">
            <div class="control">
                <label for="drawing_select">Drawing: </label>
                <select id="drawing_select"><option value="null">--None--</option></select>
            </div>
            <div class="control">
                <label for="frameStart">Start Frame: </label>
                <input type="number" id="frameStart"  value="0"/>
            </div>
            <div class="control">
                <label for="fps">Playback Speed (fps): </label>
                <input type="number" id="fps" value="6"/>
            </div>
            <div class="control">
                <label for="loop">Loop: </label>
                <input type="checkbox" id="loop" checked="true"/>
            </div>
        </div>
        <div class="animPlaceholder"></div>
    </div>
</template>

<script>
export default {
    name: 'CatDrawing'
}
</script>

<style scoped>
.catDrawing{
    display: flex;
}

.options{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 5px;
}

.control{
    margin: 3px;
}

input:not([type="checkbox"]), select{
    box-sizing: border-box;
    width: 150px;
}

.animPlaceholder{
    display: block;
    width: 200px;
    height: 200px;
    background: gray;
}
</style>