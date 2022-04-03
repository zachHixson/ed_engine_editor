<template>
    <div class="enum">
        <select
            :style="`width: ${selectWidth};`"
            @change="setWidgetData($event.target.value)" :value="enumValue">
            <option
                v-for="option in enumOptions"
                :key="option"
                :value="option">{{$t('node.' + option)}}</option>
        </select>
    </div>
</template>

<script>
export default {
    name: 'Enum',
    props: ['widget', 'widgetData', 'setWidgetData'],
    computed: {
        enumOptions(){
            return this.widget.options;
        },
        selectWidth(){
            if (this.enumOptions.length <= 0) return '20px';

            let largest = this.$t('node.' + this.enumOptions[0]).length;

            this.enumOptions.forEach(option => {
                let curLength = this.$t('node.' + option).length;
                if (curLength > largest){
                    largest = curLength;
                }
            });

            return `${largest + 2}em`;
        },
        enumValue(){
            return this.widgetData ?? this.enumOptions[0];
        },
    },
    mounted(){
        this.$nextTick(()=>{
            this.setWidgetData(this.enumValue);
        });
    },
}
</script>

<style scoped>
.enum{
    padding: 5px;
}
</style>