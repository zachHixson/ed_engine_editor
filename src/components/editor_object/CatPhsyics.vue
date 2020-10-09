<template>
    <div class="catPhysics">
        <div class="control">
            <label for="collision">Object Collision</label>
            <input type="checkbox" id="collision" checked="true" />
        </div>
        <div class="control">
            <label for="useGravity">Affected by Gravity</label>
            <input type="checkbox" id="useGravity" checked="true" />
        </div>
        <div class="control">
            <label for="roomGravity">Use room gravity</label>
            <input type="checkbox" id="roomGravity" checked="true" />
        </div>
        <div class="control">
            <div>Custom Gravity Direction</div>
            <div class="gravPlaceholder"></div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CatPhysics'
}
</script>

<style scoped>
.catPhysics{
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

.gravPlaceholder{
    width: 100px;
    height: 100px;
    border-radius: 100%;
    background: white;
}
</style>