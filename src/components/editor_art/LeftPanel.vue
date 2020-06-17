<template>
    <div id="leftPanel">
        <div id="leftPanelWrapper" ref="leftPanelWrapper">
            <div id="panelContents">
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
            </div>
            <button class="collapseButton" ref="collapseButton" @click="collapse">
                &lt;
            </button>
        </div>
        <div id="expandWrapper" ref="expandWrapper">
            <button class="collapseButton" ref="expandButton" @click="collapse">
                &gt;
            </button>
        </div>
    </div>
</template>

<script>
import {mapActions, mapGetters} from 'vuex';
import iro from '@jaames/iro';
import Brush from './Brush';

let collapsed = false;
let colorPicker;

export default {    
    name : "LeftPanel",
    components: {
        Brush
    },
    methods:{
        ...mapActions({selectColor: 'ArtEditor/selectColor'}),
        collapse(event){
            let leftPanel = this.$refs.leftPanelWrapper;
            let expandWrapper = this.$refs.expandWrapper;

            if (collapsed){
                leftPanel.style.display = "flex";
                expandWrapper.style.display = "none";
            }
            else{
                leftPanel.style.display = "none";
                expandWrapper.style.display = "flex";
            }

            collapsed = !collapsed;
            this.$emit('changed');
        },
        colorChanged(color){
            this.selectColor(color.hexString);
        }
    },
    mounted(){
        colorPicker = new iro.ColorPicker('#picker', {
            width: 200
        });
        expandWrapper.style.display = "none";

        colorPicker.on("color:change", this.colorChanged);
    }
}
</script>

<style scope>
    #leftPanel{
        height: 100%;
    }

    #leftPanelWrapper{
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        background: #FFAAAA;
        width: 200pt;
        height: 100%;
        border-right: 1px solid black;
    }

    #collapseWrapper{
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content:flex-start;
        flex-grow: 1;
    }

    #pickerWrapper{
        display: flex;
        justify-content: center;
        padding: 10pt;
    }

    #brushSizeContainer{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        border-bottom: 1px solid black;
        width: 100%;
    }

    #toolType{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .collapseButton{
        align-self: center;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-grow: 1;
        width: 10pt;
        height: 30pt;
        background: none;
        border: 1px solid black;
    }

    #collapseButton > *{
        pointer-events: none;
    }

    #expandWrapper{
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 100%;
        background: #FFAAAA;
        width: 15pt;
    }
</style>