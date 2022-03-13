<template>
    <div class="playWindow">
        <div class="headerBar">
            <div class="headerText">
                {{playState == PLAY_STATES.PLAYING ? $t('editor_main.run') : $t('editor_main.debug')}}
            </div>
            <button class="closeBtn" @click="playState = PLAY_STATES.NOT_PLAYING">
                X
            </button>
        </div>
        <div ref="canvasWrapper" class="canvasWrapper">
            <canvas ref="canvas">//Error loading canvas</canvas>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PlayWindow',
    computed: {
        PLAY_STATES(){
            return this.$store.getters['getPlayStates'];
        },
        playState: {
            get: function(){
                return this.$store.getters['getPlayState'];
            },
            set: function(newState){
                this.$store.dispatch('setPlayState', newState);
            },
        },
    },
    mounted(){
        console.log("Mount Engine")
        let canvas = this.$refs.canvas;
        let ctx = canvas.getContext('2d');
        let wrapper = this.$refs.canvasWrapper;
        let width = Math.min(wrapper.clientWidth, wrapper.clientHeight);

        canvas.width = width;
        canvas.height = width;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    destroyed(){
        console.log("Unmount Engine");
    },
}
</script>

<style scoped>
.playWindow{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--tool-panel-bg);
}

.headerBar{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 50px;
    background: var(--heading);
    overflow: hidden;
    border: 2px solid var(--border);
    border-radius: 0 0 var(--corner-radius) var(--corner-radius);
    box-sizing: border-box;
}

.closeBtn{
    position: absolute;
    right: 3px;
    top: 3px;
    width: 40px;
    height: 40px;
    background: var(--button-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.closeBtn:hover{
    background: var(--button-hover);
}

.closeBtn:active{
    background: var(--button-down);
}

.canvasWrapper{
    display: flex;
    justify-content: center;
    flex-grow: 1;
}
</style>