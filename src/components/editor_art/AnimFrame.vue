<template>
    <div
        class="animFrame"
        ref="wrapper"
        @click="selectFrame()"
        @mouseover="hover = true"
        @mouseleave="hover = false"
        :class="{selected: isSelected}">
        <canvas ref="canvas">
            //Error loading HTML5 canvas
        </canvas>
        <button
            class="button deleteFrame"
            :title="$t('art_editor.delete_frame')"
            v-show="canDelete && hover"
            @click="deleteFrame">
            <img class="btnIcon" src="@/assets/trash.svg" style="fill: none"/>
        </button>
        <button
            class="button copyFrame"
            v-show="hover"
            @click="copyFrame">
            <img class="btnIcon" src="@/assets/copy.svg"/>
        </button>
        <button
            class="button moveUp"
            v-show="hover && !isFirst"
            @click="moveFrame($event, -1)">
            <img  class="btnIcon" src="@/assets/arrow_01.svg"/>
        </button>
        <button
            class="button moveDown"
            v-show="hover && !isLast"
            @click="moveFrame($event, 1)">
            <img class="btnIcon" src="@/assets/arrow_01.svg" style="transform: rotate(-180deg)"/>
        </button>
    </div>
</template>

<script>
import {getSpriteDimensions} from '@/common/Util_2D';
import {drawCheckerBG, drawPixelData} from '@/common/Draw_2D';

export default {
    name: 'AnimFrame',
    props: ['sprite', 'index'],
    data(){
        return {
            hover: false,
            canvas: null,
            checkerBGBuff: document.createElement('canvas'),
            pixelBuff: document.createElement('canvas')
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;

        this.canvas.width = this.$refs.wrapper.clientWidth;
        this.canvas.height = this.$refs.wrapper.clientWidth;
        this.checkerBGBuff.width = this.canvas.width;
        this.checkerBGBuff.height = this.canvas.height;
        this.pixelBuff.width = this.getSprite().dimensions;
        this.pixelBuff.height = this.getSprite().dimensions;

        drawCheckerBG(this.checkerBGBuff, 4, "#B5B5B5", '#CCCCCC');

        this.drawCanvas();
    },
    computed: {
        isSelected(){
            return this.selectedFrameIdx == this.index;
        },
        canDelete(){
            return this.sprite.frames.length > 1;
        },
        selectedFrameIdx(){
            return this.$store.getters['ArtEditor/getSelectedFrame'];
        },
        isFirst(){
            return this.index == 0;
        },
        isLast(){
            return this.index >= this.sprite.frames.length - 1;
        }
    },
    methods: {
        getSprite(){
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        },
        getFrame(){
            return this.sprite.frames[this.index];
        },
        drawCanvas(){
            let frame = this.getFrame();
            let ctx = this.canvas.getContext('2d');
            
            ctx.drawImage(this.checkerBGBuff, 0, 0, this.canvas.width, this.canvas.height);

            if (frame != null){
                let scaleFac = this.canvas.width / getSpriteDimensions(frame);

                drawPixelData(this.pixelBuff, frame);

                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;

                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
                ctx.resetTransform();
            }
        },
        updateCanvas(){
            this.drawCanvas();
        },
        selectFrame(idx = this.index){
            this.$store.dispatch('ArtEditor/selectFrame', idx);
            this.$emit('selectedFrameChanged');
        },
        deleteFrame(event){
            let selectedFrame = this.selectedFrameIdx;

            event.stopPropagation();
            event.cancelBubble = true;

            if (selectedFrame >= this.sprite.frames.length - 1){
                selectedFrame -= 1;
            }

            this.sprite.deleteFrame(this.index);
            this.$store.dispatch('ArtEditor/selectFrame', selectedFrame);
            this.$emit('frameDeleted', this.index);
        },
        copyFrame(event){
            let selectedFrame = this.selectedFrameIdx;

            event.stopPropagation();
            event.cancelBubble = true;

            if (this.index < selectedFrame){
                selectedFrame += 1;
            }
            
            this.sprite.copyFrame(this.index);
            this.$store.dispatch('ArtEditor/selectFrame', selectedFrame);
            this.$emit('frameCopied', this.index);
        },
        moveFrame(event, dir){
            let selectFrame = this.selectedFrameIdx;

            event.stopPropagation();
            event.cancelBubble = true;

            if (this.isSelected){
                selectFrame += dir;
            }
            
            this.sprite.moveFrame(this.index, dir);
            this.$store.dispatch('ArtEditor/selectFrame', selectFrame);
            this.$emit('selectedFrameChanged');
            this.$emit('frameMoved', {idx: this.index, dir});
        }
    }
}
</script>

<style>
.animFrame{
    position: relative;
    width: 100px;
    height: 100px;
    border: 4px solid var(--border);
    border-radius: 10px;
    background: #CC0000;
    overflow: hidden;
}

.animFrame:hover:not(.selected){
    border-color: var(--button-hover);
}

.selected{
    border-color: var(--selection);
}

.button{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background: var(--button-norm);
    border: none;
}

.btnIcon{
    width: 15px;
    height: 15px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}

.button:hover{
    background: var(--button-hover);
}

.deleteFrame{
    right: 0;
    top: 0;
}

.copyFrame{
    right: 0;
    bottom: 0;
}

.moveUp{
    left: 0;
    top: 0;
}

.moveDown{
    left: 0;
    bottom: 0;
}
</style>