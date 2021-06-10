<template>
    <div class="artMain">
        <ToolPanel
            class="toolPanel"
            @resized="resize"
            @color-selected="colorSelected"
            @size-selected="sizeSelected"
            @tool-selected="toolSelected" />
        <ArtCanvas
            class="artCanvas"
            ref="artCanvas"
            :tool="tool"
            :spriteFrame="currentSprite.frames[selectedFrameIdx]"
            :undoLength="undoStore.undoLength"
            :redoLength="undoStore.redoLength"
            @nav-selected="navSelected()"
            @mouse-down="tool.mouseDown($event)"
            @mouse-up="tool.mouseUp($event)"
            @mouse-move="tool.mouseMove($event)"
            @undo="undo()"
            @redo="redo()" />
        <AnimationPanel
            class="animPanel"
            ref="animPanel"
            :sprite="currentSprite"
            :frameIDs="frameIDs"
            @resized="resize"
            @selectedFrameChanged="selectedFrameChanged()"
            @frameAdded="frameAdded()"
            @frameDeleted="commitFullState()"
            @frameMoved="commitFullState()"
            @frameCopied="commitFullState()" />
    </div>
</template>

<script>
import Undo_Store from '@/common/Undo_Store';
import {CATEGORY_ID, ART_TOOL_TYPE} from '@/common/Enums';
import ToolPanel from './ToolPanel';
import ArtCanvas from './ArtCanvas';
import AnimationPanel from './AnimationPanel';
import Brush from './tools/Brush';
import Bucket from './tools/Bucket';
import Line_Brush from './tools/Line_Brush';
import Box_Brush from './tools/Box_Brush';
import Ellipse_Brush from './tools/Ellipse_Brush';
import Eraser from './tools/Eraser';
import Eye_Dropper from './tools/Eye_Dropper';

const MAX_UNDO_STEPS = 32;

export default {
    name: 'ArtEditor',
    components: {
        ToolPanel,
        ArtCanvas,
        AnimationPanel
    },
    data(){
        return {
            undoStore: new Undo_Store(MAX_UNDO_STEPS),
            currentSprite: this.$store.getters['AssetBrowser/getSelectedAsset'],
            frameIDs: this.$store.getters['AssetBrowser/getSelectedAsset'].frameIDs,
            toolMap: new Map(),
            tool: new Brush()
        }
    },
    computed: {
        selectedFrameIdx(){
            return this.$store.getters['ArtEditor/getSelectedFrame'];
        }
    },
    mounted(){
        window.addEventListener('resize', this.resize);
        this.undoStore.setInitialState(this.packageUndoData());

        this.toolMap.set(ART_TOOL_TYPE.BRUSH, (()=> new Brush()).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.BUCKET, (()=> new Bucket()).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.LINE, (()=> new Line_Brush()).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.BOX, (()=> new Box_Brush()).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.BOX_FILL, (()=> new Box_Brush(true)).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.ELLIPSE, (()=> new Ellipse_Brush()).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.ELLIPSE_FILL, (()=> new Ellipse_Brush(true)).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.ERASER, (()=> new Eraser()).bind(this));
        this.toolMap.set(ART_TOOL_TYPE.EYE_DROPPER, (()=> new Eye_Dropper()).bind(this));

        this.toolSelected(this.$store.getters['ArtEditor/getSelectedTool']);
    },
    beforeDestroy(){
        window.removeEventListener('resize', this.resize);
    },
    methods:{
        resize(){
            this.$refs.artCanvas.resize();
        },
        spriteDataChanged(){
            this.$refs.animPanel.updateFramePreviews();
            this.commitFullState();
            this.currentSprite.updateFrame(this.selectedFrameIdx);
            this.updateFrameIDs();
            this.$emit('asset-changed', this.currentSprite.id);
        },
        selectedFrameChanged(){
            this.updateFrameIDs();
        },
        frameAdded(){
            this.commitFullState();
            this.updateFrameIDs();
        },
        navSelected(){
            this.$store.dispatch('ArtEditor/selectTool', null);
        },
        colorSelected(newColor){
            this.tool.setToolColor(newColor);
        },
        sizeSelected(newSize){
            this.tool.setToolSize(newSize);
        },
        toolSelected(newTool){
            this.$store.dispatch('ArtEditor/setSelectedNavTool', null);
            this.tool = this.getTool(newTool);
            this.tool.brushSize = this.$store.getters['ArtEditor/getSelectedSize'];
            this.tool.color = this.$store.getters['ArtEditor/getSelectedColor'];
            this.tool.setCommitCallback(this.spriteDataChanged.bind(this));
        },
        getTool(newTool){
            let getter = this.toolMap.get(newTool);

            if (getter){
                return getter();
            }
            else{
                console.warn("Warning: Unkown brush: \"" + newTool + ".\" Defaulting to standard brush");
                return new Brush();
            }
        },
        commitFullState(){
            this.undoStore.commit(this.packageUndoData());
        },
        undo(){
            let prevStep = this.undoStore.stepBack();

            if (prevStep && prevStep.spriteData){
                this.currentSprite.setFramesFromArray(prevStep.spriteData);
            }
            else{
                this.currentSprite.setFramesFromArray(this.undoStore.initialState.spriteData);
            }

            this.updateFrameIDs();
            
            this.$nextTick(()=>{
                this.$refs.animPanel.updateFramePreviews();
            });
        },
        redo(){
            let nextStep = this.undoStore.stepForward();

            if (nextStep && nextStep.spriteData){
                this.currentSprite.setFramesFromArray(nextStep.spriteData);
            }

            this.updateFrameIDs();

            this.$nextTick(()=>{
                this.$refs.animPanel.updateFramePreviews();
            });
        },
        packageUndoData(){
            return {
                spriteData: [...this.currentSprite.getFramesCopy()]
            }
        },
        updateAssetSelection(){
            let newAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];
            this.undoStore.clear();

            if (newAsset && newAsset.category_ID == CATEGORY_ID.SPRITE){
                let selectedFrame = this.$store.getters['ArtEditor/getSelectedFrame'];

                this.currentSprite = newAsset;
                this.updateFrameIDs()

                if (this.currentSprite.frames.length < selectedFrame + 1){
                    this.$store.dispatch('ArtEditor/selectFrame', 0);
                }
            }
        },
        updateFrameIDs(){
            this.frameIDs = this.currentSprite.frameIDs;
        }
    }
}
</script>

<style scoped>
.artMain{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    margin:none;
    padding:none;
    overflow: hidden;
    background: white;
}
</style>