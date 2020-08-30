<template>
    <div class="artMain">
        <LeftPanel
            class="leftPanel"
            @resized="resize"
            @tool-selected="toolSelected" />
        <ArtCanvas
            class="artCanvas"
            ref="artCanvas"
            :undoLength="undoStore.undoLength"
            :redoLength="undoStore.redoLength"
            @spriteFrameChanged="spriteChanged()"
            @nav-selected="navSelected()"
            @undo="undo()"
            @redo="redo()" />
        <AnimationPanel
            class="animPanel"
            ref="animPanel"
            @resized="resize"
            @frameChanged="frameChanged()"
            @frameAdded="frameAdded()"
            @frameDeleted="commitFullState()"
            @frameMoved="commitFullState()"
            @frameCopied="commitFullState()" />
    </div>
</template>

<script>
import {store, mapActions, mapGetters} from 'vuex';
import LeftPanel from './LeftPanel';
import ArtCanvas from './ArtCanvas';
import AnimationPanel from './AnimationPanel';
import Undo_Store from './Undo_Store';

const MAX_UNDO_STEPS = 32;

export default {
    name: 'ArtEditor',
    components: {
        LeftPanel,
        ArtCanvas,
        AnimationPanel
    },
    data(){
        return {
            undoStore: new Undo_Store(MAX_UNDO_STEPS)
        }
    },
    mounted(){
        window.addEventListener('resize', this.resize);
        this.undoStore.setInitialState(this.packageUndoData());
    },
    beforeDestroy(){
        window.removeEventListener('resize', this.resize);
    },
    methods:{
        ...mapActions({
            selectTool: 'ArtEditor/selectTool',
            setNavTool: 'ArtEditor/setSelectedNavTool',
            selectFrame: 'ArtEditor/selectFrame'
        }),
        ...mapGetters({
            getSprite: 'AssetBrowser/getSelectedAsset',
            getSelectedFrame: 'ArtEditor/getSelectedFrame'
        }),
        resize() {
            this.$refs.artCanvas.resize();
        },
        spriteChanged(){
            this.$refs.animPanel.updateFramePreviews();
            this.commitFullState();
            this.$emit('asset-changed', this.getSprite().ID);
        },
        frameChanged(){
            let undoPackage = this.packageUndoData();
            undoPackage.spriteData = null;
            this.$refs.artCanvas.setSprite();
            this.undoStore.commit(undoPackage);
        },
        frameAdded(){
            this.commitFullState();
            this.$refs.artCanvas.setSprite();
        },
        navSelected(){
            this.selectTool(null);
        },
        toolSelected(){
            this.setNavTool(null);
        },
        commitFullState(){
            this.undoStore.commit(this.packageUndoData());
        },
        undo(){
            let sprite = this.getSprite();
            let prevStep = this.undoStore.stepBack();

            if (prevStep){
                if (prevStep.selectedFrame != null){
                    this.selectFrame(prevStep.selectedFrame);
                }

                if (prevStep.spriteData != null){
                    sprite.setFramesFromArray(prevStep.spriteData);
                }
            }
            else{
                this.selectFrame(this.undoStore.initialState.selectedFrame);
                sprite.setFramesFromArray(this.undoStore.initialState.spriteData);
            }

            this.$refs.animPanel.updateFramePreviews(true);
            this.$refs.artCanvas.setSprite();
        },
        redo(){
            let sprite = this.getSprite();
            let nextStep = this.undoStore.stepForward();

            if (nextStep){
                this.selectFrame(nextStep.selectedFrame);
                sprite.setFramesFromArray(nextStep.spriteData);
            }

            this.$refs.animPanel.updateFramePreviews(true);
            this.$refs.artCanvas.setSprite();
        },
        packageUndoData(){
            return {
                selectedFrame: this.getSelectedFrame(),
                spriteData: [...this.getSprite().getFramesCopy()]
            }
        },
        updateAssetSelection(){
            this.frameChanged();
        }
    }
}
</script>

<style scoped>
    .artMain{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        margin:none;
        padding:none;
        overflow: none;
    }
</style>