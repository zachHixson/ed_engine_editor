<template>
    <div id="brush">
        {{name}}
    </div>
</template>

<script>
export default {
    name: 'Brush',
    props: ['icon', 'tool', 'name']
}
</script>

<style scope>
    #brush{
        width: 30pt;
        height: 30pt;
        background: red;
        margin: 5px;
        border-radius: 8pt;
        border: 2px solid black;
    }
</style>