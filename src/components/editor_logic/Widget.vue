<template>
    <div class="widget">
        <component
            :is="currentWidget"
            :widget="widget"
            :widgetData="widgetData"
            :setWidgetData="setWidgetData" />
    </div>
</template>

<script>
import Enum from './widgets/Enum.vue';

export default {
    name: 'Widget',
    props: ['widget', 'widgetData', 'setWidgetData'],
    data(){
        return {
            widgetMap: {}
        }
    },
    computed: {
        currentWidget(){
            switch(this.widget.type){
                case Shared.WIDGET.ENUM: return Enum;
            }
        }
    },
}
</script>

<style scoped>
.widget{
    display: flex;
    flex-direction: row;
    justify-content: center;
}
</style>