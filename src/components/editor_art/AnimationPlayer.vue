<template>
    <div class="animationPlayer">
        <canvas ref="canvas" width="150" height="150">
            //Error loading HTML5 canvas
        </canvas>
        <div class="buttons">
            <button @click="playAnimation()">
                <img class="btnImg" src="@/assets/play.svg" v-show="!isPlaying" />
                <img class="btnImg" src="@/assets/pause.svg" v-show="isPlaying" />
            </button>
            <button @click="stopAnimation()">
                <img class="btnImg" src="@/assets/box_filled.svg" />
            </button>
        </div>
    </div>
</template>

<script>
import Util_2D from '@/common/Util_2D';
import Draw_2D from '@/common/Draw_2D';

export default {
    name: 'AnimationPlayer',
    props: ['sprite'],
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
    mounted(){
        this.canvas = this.$refs.canvas;
        this.checkerBGBuff.width = this.canvas.width;
        this.checkerBGBuff.height = this.canvas.height;
        this.pixelBuff.width = this.getSprite().dimensions;
        this.pixelBuff.height = this.getSprite().dimensions;
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
                let scaleFac = this.canvas.width / Util_2D.getSpriteDimensions(frame);

                Draw_2D.drawPixelData(this.pixelBuff, frame);

                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;

                ctx.save();
                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
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
        },
        newSpriteSelection(){
            this.sprite = this.getSprite();
            this.drawFrame();
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