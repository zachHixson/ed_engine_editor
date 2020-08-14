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
            <button class="collapseButton" ref="collapseButton" @click="toggleOpen">
                &lt;
            </button>
        </div>
        <div id="expandWrapper" ref="expandWrapper">
            <button class="collapseButton" ref="expandButton" @click="toggleOpen">
                &gt;
            </button>
        </div>
    </div>
</template>

<script>
import {store, mapActions, mapGetters} from 'vuex';
import iro from '@jaames/iro';
import {TOOL_SIZE, TOOL_TYPE} from './tools/Tool';
import Brush from './Brush';

export default {    
    name : "LeftPanel",
    components: {
        Brush
    },
    data() {
        return {
            isOpen: true,
            colorPicker: null,
            brushSizes: [
                {
                    tool: TOOL_SIZE.SMALL,
                    name: this.$t('art_editor.small_brush'),
                    icon: 'assets/editor_art/small_brush'
                },
                {
                    tool: TOOL_SIZE.MEDIUM,
                    name: this.$t('art_editor.medium_brush'),
                    icon: 'assets/editor_art/medium_brush'
                },
                {
                    tool: TOOL_SIZE.LARGE,
                    name: this.$t('art_editor.large_brush'),
                    icon: 'assets/editor_art/large_brush'
                }
            ],
            brushes: [
                {
                    tool: TOOL_TYPE.BRUSH,
                    name: this.$t('art_editor.brush_tool'),
                    icon: 'assets/editor_art/brush'
                },
                {
                    tool: TOOL_TYPE.BUCKET,
                    name: this.$t('art_editor.bucket_tool'),
                    icon: 'assets/editor_art/bucket'
                },
                {
                    tool: TOOL_TYPE.LINE,
                    name: this.$t('art_editor.line_tool'),
                    icon: 'assets/editor_art/line'
                },
                {
                    tool: TOOL_TYPE.BOX,
                    name: this.$t('art_editor.box_stroke_tool'),
                    icon: 'assets/editor_art/box'
                },
                {
                    tool: TOOL_TYPE.BOX_FILL,
                    name: this.$t('art_editor.box_fill_tool'),
                    icon: 'assets/editor_art/box_filled'
                },
                {
                    tool: TOOL_TYPE.ELLIPSE,
                    name: this.$t('art_editor.circle_stroke_tool'),
                    icon: 'assets/editor_art/circle'
                },
                {
                    tool: TOOL_TYPE.ELLIPSE_FILL,
                    name: this.$t('art_editor.circle_fill_tool'),
                    icon: 'assets/editor_art/circle_filled'
                },
                {
                    tool: TOOL_TYPE.ERASER,
                    name: this.$t('art_editor.eraser_tool'),
                    icon: 'assets/editor_art/eraser'
                },
                {
                    tool: TOOL_TYPE.EYE_DROPPER,
                    name: this.$t('art_editor.eye_dropper_tool'),
                    icon: 'assets/editor_art/eye_dropper'
                }
            ]
        }
    },
    mounted(){
        this.isOpen = this.$store.getters['ArtEditor/isToolPanelOpen'];
        this.colorPicker = new iro.ColorPicker('#picker', {
            color: this.selectedColor,
            width: 200
        });
        expandWrapper.style.display = "none";

        this.resize();
        this.colorPicker.on("color:change", this.colorChanged);
    },
    beforeDestroy(){
        this.$store.dispatch('ArtEditor/setToolPanelState', this.isOpen);
    },
    computed: {
        selectedSize(){
            return this.$store.getters['ArtEditor/getSelectedSize'];
        },
        selectedTool(){
            return this.$store.getters['ArtEditor/getSelectedTool'];
        },
        selectedColor(){
            return this.$store.getters['ArtEditor/getSelectedColor'];
        }
    },
    watch: {
        selectedColor(newCol, oldCol){
            this.colorPicker.color.hexString = newCol;
        }
    },
    methods:{
        ...mapActions({
            selectColor: 'ArtEditor/selectColor',
            selectSize: 'ArtEditor/selectSize',
            selectTool: 'ArtEditor/selectTool'
        }),
        toggleOpen(){
            this.isOpen = !this.isOpen;
            this.resize();
        },
        resize(){
            let leftPanel = this.$refs.leftPanelWrapper;
            let expandWrapper = this.$refs.expandWrapper;

            if (this.isOpen){
                leftPanel.style.display = "flex";
                expandWrapper.style.display = "none";
            }
            else{
                leftPanel.style.display = "none";
                expandWrapper.style.display = "flex";
            }

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
            this.$emit('tool-selected');
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