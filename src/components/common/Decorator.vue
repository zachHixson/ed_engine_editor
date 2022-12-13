<template>
    <div class="decorator">
        <div class="wrapper">
            <img id="decorator" class="img" :src="src" />
            <Tooltip for="decorator" :text="text"/>
        </div>
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
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
}

.wrapper{
    position: relative;
    right: -100%;
    top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    margin-left: 5px;
}
</style>