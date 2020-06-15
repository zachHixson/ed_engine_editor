<template>
    <div id="leftPanelWrapper">
        <div id="pickerWrapper">
            <div id="picker"></div>
        </div>
        <div id="brushSizeContainer">
            <Brush name="Large" />
            <Brush name="Medium" />
            <Brush name="Small" />
        </div>
        <div id="toolType">
            <Brush />
            <Brush />
            <Brush />
            <Brush />
            <Brush />
        </div>
        <div id="collapseButton">
            &lt;
        </div>
    </div>
</template>

<script>
import iro from '@jaames/iro';
import Brush from './Brush';

let colorPicker;

export default {    
    name : "LeftPanel",
    components: {
        Brush
    },
    methods:{
        onResize(event){
            colorPicker.width = Math.min(
                document.getElementById('leftPanelWrapper').clientWidth,
                document.getElementById('leftPanelWrapper').clientHeight
            )
        }
    },
    mounted(){
        let panelWidth = Math.min(
            document.getElementById('leftPanelWrapper').clientWidth,
            document.getElementById('leftPanelWrapper').clientHeight
        );
        colorPicker = new iro.ColorPicker('#picker', {
            width: (panelWidth - 20)
        });
        window.addEventListener('resize', this.onResize);
    }
}
</script>

<style scope>
    #leftPanelWrapper{
        position: relative;
        background: #FFAAAA;
        width: 200px;
        height: 100%;
        border-right: 1px solid black;
        padding-right: 10px;
    }

    #pickerWrapper{
        padding: 10px;
    }

    #brushSizeContainer{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        border-bottom: 1px solid black;
    }

    #toolType{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    #collapseButton{
        position: absolute;
        display: flex;
        align-items: center;
        right: 0;
        top: 50%;
        height: 20pt;
        border: 1px solid black;
    }
</style>