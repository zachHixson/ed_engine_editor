<template>
    <div class="animationPlayer">
        <canvas ref="canvas" width="150" height="150">
            //Error loading HTML5 canvas
        </canvas>
        <div class="buttons">
            <button @click="playAnimation()">
                <img class="btnImg" src="@/assets/editor_art/play.svg" v-show="!isPlaying" />
                <img class="btnImg" src="@/assets/editor_art/pause.svg" v-show="isPlaying" />
            </button>
            <button @click="stopAnimation()">
                <img class="btnImg" src="@/assets/editor_art/box_filled.svg" />
            </button>
        </div>
    </div>
</template>

<script>
import Util_2D from '@/common/Util_2D';
import Draw_2D from '@/common/Draw_2D';

export default {
    name: 'AnimationPlayer',
    data(){
        return {
            curFrameIdx: 0,
            canvas: null,
            checkerBGBuff: document.createElement('canvas'),
            sprite: null,
            animationLoop: null
        }
    },
    computed: {
        isPlaying(){
            return this.animationLoop != null;
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;
        this.checkerBGBuff.width = this.canvas.width;
        this.checkerBGBuff.height = this.canvas.height;
        this.sprite = this.getSprite();

        Draw_2D.drawCheckerBG(this.checkerBGBuff, 4, '#AAA', '#CCC');

        this.drawFrame();
    },
    methods: {
        getSprite(){
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        },
        drawFrame(){
            let ctx = this.canvas.getContext('2d');

            ctx.drawImage(this.checkerBGBuff, 0, 0, this.canvas.width, this.canvas.height);

            if (this.sprite.frames[this.curFrameIdx] != null){
                let frame = this.sprite.frames[this.curFrameIdx];
                let pixelSize = this.canvas.width / this.sprite.dimensions;
                let scaleFac = (pixelSize) / Math.round(pixelSize);

                ctx.save();
                ctx.scale(scaleFac, scaleFac);
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                Draw_2D.drawPixelData(this.canvas, this.canvas.width, frame);
                ctx.restore();
            }
        },
        advanceFrame(){
            this.curFrameIdx = (this.curFrameIdx + 1) % this.sprite.frames.length;
        },
        playAnimation(){
            if (this.animationLoop == null){
                let intervalTime = 1000/12;

                this.animationLoop = setInterval(()=>{
                    this.drawFrame();
                    this.advanceFrame();
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
            this.curFrameIdx = 0;
            this.drawFrame();
        },
        frameDataChanged(){
            let selectedFrame = this.$store.getters['ArtEditor/getSelectedFrame'];
            if (this.curFrameIdx == selectedFrame){
                this.drawFrame();
            }
        }
    }
}
</script>

<style scoped>
    .animationPlayer{
        display: flex;
        flex-direction: column;
    }

    .buttons{
        display: flex;
        flex-direction: row;
        justify-content: center;
    }

    .btnImg{
        width: 20px;
        height: 20px;
    }
</style>