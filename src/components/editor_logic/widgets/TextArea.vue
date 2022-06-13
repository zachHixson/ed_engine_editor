<template>
    <div>
        <textarea
            rows="4"
            cols="20"
            style="resize: none;"
            @change="setWidgetData($event.target.value)" :value="text" v-input-active></textarea>
    </div>
</template>

<script>
export default {
    name: 'TextArea',
    props: ['widget', 'widgetData', 'setWidgetData'],
    computed: {
        text(){
            return this.widgetData ?? '';
        }
    },
    mounted(){
        this.$nextTick(()=>{
            this.setWidgetData(this.text);
        });
    },
}
</script>