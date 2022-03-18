<template>
    <div class="animationPlayer">
        <canvas ref="canvas" width="150" height="150">
            //Error loading HTML5 canvas
        </canvas>
        <div class="buttons">
            <button @click="playAnimation()">
                <img class="btnImg" src="@/assets/play.svg" v-show="!isPlaying"/>
                <img class="btnImg" src="@/assets/pause.svg" v-show="isPlaying"/>
            </button>
            <button @click="stopAnimation()">
                <img class="btnImg" src="@/assets/box_filled.svg"/>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AnimationPlayer',
    props: ['sprite', 'fps', 'startFrame', 'loop'],
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
        },
    },
    mounted(){
        this.canvas = this.$refs.canvas;
        this.checkerBGBuff.width = this.canvas.width;
        this.checkerBGBuff.height = this.canvas.height;

        Shared.drawCheckerBG(this.checkerBGBuff, 4, "#B5B5B5", '#CCCCCC');
        if (this.sprite){
            this.pixelBuff.width = Shared.Sprite.DIMENSIONS;
            this.pixelBuff.height = Shared.Sprite.DIMENSIONS;
        }

        this.$parent.$on('frameDeleted', this.onFrameDelete);

        this.newSpriteSelection();
    },
    methods: {
        drawFrame(){
            let ctx = this.canvas.getContext('2d');
            
            ctx.drawImage(this.checkerBGBuff, 0, 0, this.canvas.width, this.canvas.height);

            if (this.sprite && this.sprite.frames[this.curFrameIdx] != null){
                let frame = this.sprite.frames[this.curFrameIdx];
                let scaleFac = this.canvas.width / Shared.Sprite.DIMENSIONS;

                this.sprite.drawToCanvas(this.curFrameIdx, this.pixelBuff);

                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;

                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
                ctx.resetTransform();
            }
        },
        advanceFrame(){
            let nextFrame = (this.curFrameIdx + 1);

            if (this.loop){
                this.curFrameIdx = nextFrame % this.sprite.frames.length;
            }
            else{
                this.curFrameIdx = Math.min(nextFrame, this.sprite.frames.length - 1);
            }
        },
        playAnimation(){
            if (this.sprite && this.animationLoop == null && this.fps > 0){
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
            if (this.animationLoop){
                this.pauseAnimation();
                this.playAnimation();
            }
        },
        newSpriteSelection(){
            if (this.sprite){
                this.pixelBuff.width = Shared.Sprite.DIMENSIONS;
                this.pixelBuff.height = Shared.Sprite.DIMENSIONS;
            }

            this.curFrameIdx = this.startFrame;

            this.$nextTick(()=>{
                this.drawFrame();
            });
        },
        onFrameDelete(){
            this.curFrameIdx = Math.min(this.curFrameIdx, this.sprite.frames.length - 1);
            this.drawFrame();
        },
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