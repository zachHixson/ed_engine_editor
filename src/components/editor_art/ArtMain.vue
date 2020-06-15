<template>
    <div class="artMain">
        <LeftPanel />
    </div>
</template>

<script>
import LeftPanel from './LeftPanel';

export default {
    name: 'ArtEditor',
    components: {
        LeftPanel
    }
}
</script>

<style scope>
    .artMain{
        height: 100%;
    }
</style>