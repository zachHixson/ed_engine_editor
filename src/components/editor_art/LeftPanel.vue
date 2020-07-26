<template>
    <div id="leftPanel">
        <div id="leftPanelWrapper" ref="leftPanelWrapper">
            <div id="panelContents">
                <div id="pickerWrapper">
                    <div id="picker"></div>
                </div>
                <div id="brushSizeContainer">
                    <Brush
                        :key="size.tool"
                        v-for="size in brushSizes"
                        :icon="size.icon"
                        :tool="size.tool"
                        :name="size.name"
                        :curSelection="selectedSize"
                        @toolClicked="sizeChanged"/>
                </div>
                <div id="toolType">
                    <Brush
                        :key="brush.tool"
                        v-for="brush in brushes"
                        :icon="brush.icon"
                        :tool="brush.tool"
                        :name="brush.name"
                        :curSelection="selectedTool"
                        @toolClicked="toolChanged"/>
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
import {store, mapActions, mapGetters} from 'vuex';
import iro from '@jaames/iro';
import Brush from './Brush';

let collapsed = false;
let colorPicker;

export default {    
    name : "LeftPanel",
    components: {
        Brush
    },
    data() {
        return {
            brushSizes: [
                {
                    tool: 'small_brush',
                    name: this.$t('art_editor.small_brush'),
                    icon: 'assets/editor_art/small_brush'
                },
                {
                    tool: 'medium_brush',
                    name: this.$t('art_editor.medium_brush'),
                    icon: 'assets/editor_art/medium_brush'
                },
                {
                    tool: 'large_brush',
                    name: this.$t('art_editor.large_brush'),
                    icon: 'assets/editor_art/large_brush'
                }
            ],
            brushes: [
                {
                    tool: 'brush',
                    name: this.$t('art_editor.brush_tool'),
                    icon: 'assets/editor_art/brush'
                },
                {
                    tool: 'bucket',
                    name: this.$t('art_editor.bucket_tool'),
                    icon: 'assets/editor_art/bucket'
                },
                {
                    tool: 'line',
                    name: this.$t('art_editor.line_tool'),
                    icon: 'assets/editor_art/line'
                },
                {
                    tool: 'box',
                    name: this.$t('art_editor.box_stroke_tool'),
                    icon: 'assets/editor_art/box'
                },
                {
                    tool: 'box_fill',
                    name: this.$t('art_editor.box_fill_tool'),
                    icon: 'assets/editor_art/box_filled'
                },
                {
                    tool: 'ellipse',
                    name: this.$t('art_editor.circle_stroke_tool'),
                    icon: 'assets/editor_art/circle'
                },
                {
                    tool: 'ellipse_fill',
                    name: this.$t('art_editor.circle_fill_tool'),
                    icon: 'assets/editor_art/circle_filled'
                },
                {
                    tool: 'eraser',
                    name: this.$t('art_editor.eraser_tool'),
                    icon: 'assets/editor_art/eraser'
                }
            ]
        }
    },
    mounted(){
        colorPicker = new iro.ColorPicker('#picker', {
            color: this.selectedColor,
            width: 200
        });
        expandWrapper.style.display = "none";

        colorPicker.on("color:change", this.colorChanged);
    },
    computed: {
        selectedSize(){
            return this.$store.getters['ArtEditor/getSelectedSize'];
        },
        selectedTool(){
            return this.$store.getters['ArtEditor/getSelectedTool'];
        },
        selectedColor(){
            return this.$store.getters['ArtEditor/getSelectedColor']
        }
    },
    methods:{
        ...mapActions({
            selectColor: 'ArtEditor/selectColor',
            selectSize: 'ArtEditor/selectSize',
            selectTool: 'ArtEditor/selectTool'
        }),
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
            this.$emit('resized');
        },
        colorChanged(color){
            this.selectColor(color.hexString);
        },
        sizeChanged(newSize){
            this.selectSize(newSize);
        },
        toolChanged(newTool){
            this.selectTool(newTool);
        }
    }
}
</script>

<style scoped>
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

    #panelContents{
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content:flex-start;
        flex-grow: 1;
        height: 100%;
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