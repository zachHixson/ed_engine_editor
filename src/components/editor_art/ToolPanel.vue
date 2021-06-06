<template>
    <div class="toolPanel">
        <div class="toolPanelWrapper" :class="{toolPanelWrapperClosed : !isOpen}">
            <div v-show="isOpen" class="panelContents">
                <div class="pickerWrapper">
                    <div id="picker" class="picker"></div>
                </div>
                <div class="brushSizeContainer">
                    <Tool
                        :key="size.tool"
                        v-for="size in brushSizes"
                        :icon="size.icon"
                        :tool="size.tool"
                        :name="size.name"
                        :curSelection="selectedSize"
                        @toolClicked="sizeChanged"/>
                </div>
                <div class="toolType">
                    <Tool
                        :key="brush.tool"
                        v-for="brush in brushes"
                        :icon="brush.icon"
                        :tool="brush.tool"
                        :name="brush.name"
                        :curSelection="selectedTool"
                        @toolClicked="toolChanged"/>
                </div>
            </div>
            <div class="resizeBtnWrapper">
                <button class="resizeBtn" ref="collapseButton" @click="toggleOpen">
                    <img v-show="isOpen" src="@/assets/arrow_01.svg" style="transform: rotate(-90deg)"/>
                    <img v-show="!isOpen" src="@/assets/brush.svg" />
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import {mapActions} from 'vuex';
import iro from '@jaames/iro';
import {ART_TOOL_SIZE, ART_TOOL_TYPE} from '@/common/Enums';
import Tool from '@/components/common/Tool';

export default {    
    name : "ToolPanel",
    components: {
        Tool
    },
    data() {
        return {
            isOpen: true,
            colorPicker: null,
            brushSizes: [
                {
                    tool: ART_TOOL_SIZE.SMALL,
                    name: this.$t('art_editor.small_brush'),
                    icon: 'assets/small_brush'
                },
                {
                    tool: ART_TOOL_SIZE.MEDIUM,
                    name: this.$t('art_editor.medium_brush'),
                    icon: 'assets/medium_brush'
                },
                {
                    tool: ART_TOOL_SIZE.LARGE,
                    name: this.$t('art_editor.large_brush'),
                    icon: 'assets/large_brush'
                }
            ],
            brushes: [
                {
                    tool: ART_TOOL_TYPE.BRUSH,
                    name: this.$t('art_editor.brush_tool'),
                    icon: 'assets/brush'
                },
                {
                    tool: ART_TOOL_TYPE.BUCKET,
                    name: this.$t('art_editor.bucket_tool'),
                    icon: 'assets/bucket'
                },
                {
                    tool: ART_TOOL_TYPE.LINE,
                    name: this.$t('art_editor.line_tool'),
                    icon: 'assets/line'
                },
                {
                    tool: ART_TOOL_TYPE.BOX,
                    name: this.$t('art_editor.box_stroke_tool'),
                    icon: 'assets/box'
                },
                {
                    tool: ART_TOOL_TYPE.BOX_FILL,
                    name: this.$t('art_editor.box_fill_tool'),
                    icon: 'assets/box_filled'
                },
                {
                    tool: ART_TOOL_TYPE.ELLIPSE,
                    name: this.$t('art_editor.circle_stroke_tool'),
                    icon: 'assets/circle'
                },
                {
                    tool: ART_TOOL_TYPE.ELLIPSE_FILL,
                    name: this.$t('art_editor.circle_fill_tool'),
                    icon: 'assets/circle_filled'
                },
                {
                    tool: ART_TOOL_TYPE.ERASER,
                    name: this.$t('art_editor.eraser_tool'),
                    icon: 'assets/eraser'
                },
                {
                    tool: ART_TOOL_TYPE.EYE_DROPPER,
                    name: this.$t('art_editor.eye_dropper_tool'),
                    icon: 'assets/eye_dropper'
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
        this.colorPicker.on("color:change", this.colorChanged);
        this.$emit('resized');
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
        selectedColor(newCol){
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
            this.$nextTick(()=>{
                this.$emit('resized');
            });
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
.toolPanelWrapper{
    position: relative;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    height: 95%;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
}

.toolPanelWrapperClosed{
    border: none;
}

.panelContents{
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content:flex-start;
    flex-grow: 1;
    width: 200pt;
    height: 100%;
    overflow-y: auto;
}

.pickerWrapper{
    display: flex;
    justify-content: center;
    padding: 10pt;
}

.brushSizeContainer{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    border-bottom: 1px solid black;
    width: 100%;
}

.toolType{
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
    width: 20px;
    height: 50px;
    background: none;
    border: 1px solid black;
}

.resizeBtnWrapper{
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
}

.resizeBtn{
    position: relative;
    width: 30px;
    height: 70px;
    padding: 0;
    padding: 2px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    z-index: 15;
}

.resizeBtn > img{
    width: 100%;
    height: 100%;
}
</style>