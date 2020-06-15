<template>
    <div class="artMain">
        <LeftPanel />
        <ArtCanvas />
    </div>
</template>

<script>
import LeftPanel from './LeftPanel';
import ArtCanvas from './ArtCanvas';

export default {
    name: 'ArtEditor',
    components: {
        LeftPanel,
        ArtCanvas
    }
}
</script>

<style scope>
    .artMain{
        display: flex;
        flex-direction: row;
        height: 100%;
        margin:none;
        padding:none;
    }
</style>