<template>
    <div class="decorator">
        <img name="decorator" class="img" :src="src" draggable="false" v-tooltip="text"/>
    </div>
</template>

<script>
import Tooltip from '@/components/common/Tooltip';

export default {
    name: 'Decorator',
    props: ['src', 'tooltipText'],
    components: {
        Tooltip,
    },
    data(){
        return {
            text: this.tooltipText ?? '',
        }
    },
    methods: {
        setTooltipText(text){
            this.text = text;
        }
    }
}
</script>

<style scoped>
.decorator{
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: auto;
}
</style>