<template>
    <div>
        <canvas ref="canvas" width="200" height="200">
            //Error loading canvas
        </canvas>
    </div>
</template>

<script>
import Victor from 'victor';
import {HSVToRGB} from '@/common/Draw_2D';

export default {
    name: 'ColorPicker',
    data(){
        return {
            canvas: null,
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;

        this.drawWheel();
    },
    methods: {
        drawWheel(){
            let ctx = this.canvas.getContext('2d');
            let imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            let colors = new Array(this.canvas.width * this.canvas.height);

            for (let i = 0; i < colors.length; i++){
                let pos = new Victor(i % this.canvas.width, Math.floor(i / this.canvas.width));
                let relPos = new Victor(pos.x / this.canvas.width, pos.y / this.canvas.height).subtractScalar(0.5).multiplyScalar(2);
                let hue = (Math.atan2(relPos.y, relPos.x) + Math.PI) * (180 / Math.PI);
                let sat = relPos.length();
                let val = 1;
                let rgb = HSVToRGB(hue, sat, val);

                /*
                    Need to use image data instead
                */
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(sat < 1) + 0})`;
                ctx.fillRect(pos.x, pos.y, 1, 1);
            }
        },
    }
}
</script>

<style>

</style>