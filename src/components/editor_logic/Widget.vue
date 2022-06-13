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
import Key from './widgets/Key.vue';
import TextArea from './widgets/TextArea.vue';

export default {
    name: 'Widget',
    props: ['widget', 'widgetData', 'setWidgetData'],
    computed: {
        currentWidget(){
            const WIDGET = Shared.WIDGET;

            switch(this.widget.type){
                case WIDGET.ENUM: return Enum;
                case WIDGET.KEY: return Key;
                case WIDGET.TEXT_AREA: return TextArea;
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