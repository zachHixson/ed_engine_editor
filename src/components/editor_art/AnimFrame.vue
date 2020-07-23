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
            X
        </button>
        <button
            class="button copyFrame"
            v-show="hover"
            @click="copyFrame">
            <img class="btnIcon" src="@/assets/editor_art/copy.svg" />
        </button>
        <button
            class="button moveUp"
            v-show="hover && !isFirst"
            @click="moveFrame($event, -1)">
            <img class="btnIcon" src="@/assets/editor_art/arrow_01_up.svg" />
        </button>
        <button
            class="button moveDown"
            v-show="hover && !isLast"
            @click="moveFrame($event, 1)">
            <img class="btnIcon" src="@/assets/editor_art/arrow_01_down.svg" />
        </button>
    </div>
</template>

<script>
import {state} from 'vuex';
import Util_2D from '@/common/Util_2D';
import Draw_2D from '@/common/Draw_2D';

export default {
    name: 'AnimFrame',
    props: ['sprite', 'index'],
    data(){
        return {
            hover: false,
            canvas: null,
            checkerBGBuff: document.createElement('canvas')
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;

        this.canvas.width = this.$refs.wrapper.clientWidth;
        this.canvas.height = this.$refs.wrapper.clientWidth;
        this.checkerBGBuff.width = this.canvas.width;
        this.checkerBGBuff.height = this.canvas.height;

        Draw_2D.drawCheckerBG(this.checkerBGBuff, 4, '#AAA', '#CCC');

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
        getFrame(){
            return this.sprite.frames[this.index];
        },
        drawCanvas(){
            let frame = this.getFrame();
            let ctx = this.canvas.getContext('2d');

            ctx.drawImage(this.checkerBGBuff, 0, 0, this.canvas.width, this.canvas.height);

            if (frame != null){
                let pixelSize = this.canvas.width / this.sprite.dimensions;
                let scaleFac = (pixelSize) / Math.round(pixelSize);

                ctx.save();
                ctx.scale(scaleFac, scaleFac);
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                Draw_2D.drawPixelData(this.canvas, this.canvas.width, frame);
                ctx.restore();
            }
        },
        updateCanvas(forceUpdate = false){
            if (this.isSelected || forceUpdate){
                this.drawCanvas();
            }
        },
        selectFrame(idx = this.index){
            this.$store.dispatch('ArtEditor/selectFrame', idx);
            this.$emit('frameChanged');
        },
        deleteFrame(event){
            let selectedFrame = this.selectedFrameIdx;

            event.stopPropagation();
            event.cancelBubble = true;

            if (selectedFrame >= this.sprite.frames.length - 1){
                selectedFrame -= 1;
            }

            this.sprite.deleteFrame(this.index);
            this.selectFrame(selectedFrame);
            this.$emit('frameDeleted');
        },
        copyFrame(event){
            let selectedFrame = this.selectedFrameIdx;

            event.stopPropagation();
            event.cancelBubble = true;

            if (this.index < selectedFrame){
                selectedFrame += 1;
            }

            this.sprite.copyFrame(this.index);
            this.selectFrame(selectedFrame);
            this.$emit('frameCopied');
        },
        moveFrame(event, dir){
            let selectFrame = this.selectedFrameIdx;

            event.stopPropagation();
            event.cancelBubble = true;

            if (this.isSelected){
                selectFrame += dir;
            }

            this.sprite.moveFrame(this.index, dir);
            this.selectFrame(selectFrame);
            this.$emit('frameMoved');
        }
    }
}
</script>

<style>
    .animFrame{
        position: relative;
        width: 100px;
        height: 100px;
        border: 4px solid #CC6666;
        border-radius: 10px;
        background: #CC0000;
        overflow: hidden;
    }

    .animFrame:hover:not(.selected){
        border-color: #CC9999;
    }

    .selected{
        border-color: black;
    }

    .button{
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        background: white;
        border: none;
    }

    .btnIcon{
        width: 15px;
        height: 15px;
    }

    .button:hover{
        background: gray;
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