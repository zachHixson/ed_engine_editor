<template>
    <div class="animationPlayer">
        <canvas ref="canvas" width="150" height="150">
            //Error loading HTML5 canvas
        </canvas>
        <div class="buttons">
            <button @click="playAnimation()">
                <inline-svg class="btnImg" :src="require('@/assets/play.svg')" v-show="!isPlaying"
                    :transformSource="removeStroke"/>
                <inline-svg class="btnImg" :src="require('@/assets/pause.svg')" v-show="isPlaying"
                    :transformSource="removeStroke"/>
            </button>
            <button @click="stopAnimation()">
                <inline-svg class="btnImg" :src="require('@/assets/box_filled.svg')"
                    :transformSource="removeStroke"/>
            </button>
        </div>
    </div>
</template>

<script>
import Util_2D from '@/common/Util_2D';
import Draw_2D from '@/common/Draw_2D';
import {removeStroke} from '@/common/Util';

export default {
    name: 'AnimationPlayer',
    props: ['sprite', 'selectedFrame', 'fps', 'startFrame'],
    data(){
        return {
            curFrameIdx: 0,
            canvas: null,
            checkerBGBuff: document.createElement('canvas'),
            pixelBuff: document.createElement('canvas'),
            animationLoop: null
        }
    },
    computed: {
        isPlaying(){
            return this.animationLoop != null;
        }
    },
    watch: {
        sprite(){
            this.newSpriteSelection();
        },
        startFrame: function(val) {
            this.curFrameIdx = val;
            this.drawFrame();
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;
        this.checkerBGBuff.width = this.canvas.width;
        this.checkerBGBuff.height = this.canvas.height;

        Draw_2D.drawCheckerBG(this.checkerBGBuff, 4, '#AAA', '#CCC');
        if (this.sprite){
            this.pixelBuff.width = this.sprite.dimensions;
            this.pixelBuff.height = this.sprite.dimensions;
        }

        this.newSpriteSelection();
    },
    methods: {
        drawFrame(){
            let ctx = this.canvas.getContext('2d');
            
            ctx.drawImage(this.checkerBGBuff, 0, 0, this.canvas.width, this.canvas.height);

            if (this.sprite && this.sprite.frames[this.curFrameIdx] != null){
                let frame = this.sprite.frames[this.curFrameIdx];
                let scaleFac = this.canvas.width / Util_2D.getSpriteDimensions(frame);

                Draw_2D.drawPixelData(this.pixelBuff, frame);

                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;

                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
                ctx.resetTransform();
            }
        },
        advanceFrame(){
            this.curFrameIdx = (this.curFrameIdx + 1) % this.sprite.frames.length;
        },
        playAnimation(){
            if (this.animationLoop == null && this.fps > 0){
                let intervalTime = 1000/this.fps;

                this.animationLoop = setInterval(()=>{
                    this.advanceFrame();
                    this.drawFrame();
                }, intervalTime);
            }
            else{
                this.pauseAnimation();
            }
        },
        pauseAnimation(){
            clearInterval(this.animationLoop);
            this.animationLoop = null;
        },
        stopAnimation(){
            this.pauseAnimation();
            this.curFrameIdx = this.startFrame;
            this.drawFrame();
        },
        frameDataChanged(){
            this.drawFrame();
        },
        fpsChanged(){
            this.pauseAnimation();
            this.playAnimation();
        },
        newSpriteSelection(){
            if (this.sprite){
                this.pixelBuff.width = this.sprite.dimensions;
                this.pixelBuff.height = this.sprite.dimensions;
            }

            this.curFrameIdx = this.startFrame;

            this.$nextTick(()=>{
                this.drawFrame();
            });
        },
        removeStroke
    }
}
</script>

<style scoped>
.animationPlayer{
    display: flex;
    flex-direction: column;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    overflow: hidden;
}

.buttons{
    display: flex;
    flex-direction: row;
    justify-content: center;
    background: var(--button-dark-norm);
}

.buttons > button{
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: 3px;
    padding: 3px;
    margin: 2px;
}

.buttons > button:hover{
    background: var(--button-dark-hover);
}

.buttons > button:active{
    background: var(--button-dark-down);
}

.btnImg{
    width: 20px;
    height: 20px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}
</style>