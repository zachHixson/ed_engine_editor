<template>
    <div>
        <div class="wheelWrapper">
            <canvas
                ref="canvas"
                width="200"
                height="200"
                @mousedown="mouseDown"
                @mouseup="mouseUp">
                //Error loading canvas
            </canvas>
            <div ref="cursor" class="cursor"></div>
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import {HSVToRGB, RGBAToHex, hexToRGBA, RGBToHSV} from '@/common/Draw_2D';

export default {
    name: 'ColorPicker',
    props: ['color'],
    data(){
        return {
            canvas: null,
            cursorPos: new Victor(0, 0),
            selectedColor: this.color ?? '#FFFFFF',
        }
    },
    watch: {
        color(newVal){
            this.selectedColor = newVal;
            this.moveCursorToColor(this.selectedColor);
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;

        this.drawWheel();
        this.moveCursorToColor(this.selectedColor);
    },
    beforeDestroy(){
        document.removeEventListener("mousemove", this.mouseMove);
    },
    methods: {
        drawWheel(){
            let ctx = this.canvas.getContext('2d');
            let circleBuff = Object.assign(document.createElement('canvas'), {width: this.canvas.width, height: this.canvas.height});
            let circleCtx = circleBuff.getContext('2d');
            let colors = new Uint8ClampedArray(this.canvas.width * this.canvas.height * 4);
            let imgData;

            for (let i = 0; i < colors.length; i++){
                let pIdx = i * 4;
                let pos = new Victor(i % this.canvas.width, Math.floor(i / this.canvas.width));
                let relPos = new Victor(pos.x / this.canvas.width, pos.y / this.canvas.height).subtractScalar(0.5).multiplyScalar(2);
                let hue = (Math.atan2(relPos.y, relPos.x) + Math.PI) * (180 / Math.PI);
                let sat = relPos.length();
                let val = 1;
                let rgb = HSVToRGB(hue, sat, val);

                /*
                    Need to use image data instead
                */
                colors[pIdx + 0] = rgb.r;
                colors[pIdx + 1] = rgb.g;
                colors[pIdx + 2] = rgb.b;
                colors[pIdx + 3] = 255;
            }

            //draw circle mask
            circleCtx.fillStyle = 'white';
            circleCtx.beginPath();
            circleCtx.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2, 0, Math.PI * 2);
            circleCtx.fill();

            imgData = new ImageData(colors, this.canvas.width);
            ctx.putImageData(imgData, 0, 0);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(circleBuff, 0, 0);
        },
        updateCursorPos(x, y){
            let canvas = this.$refs.canvas;
            let halfSize = this.$refs.cursor.clientWidth / 2;
            let halfCanvas = canvas.width / 2;
            let imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            let canvasBounds = canvas.getBoundingClientRect();
            let cursorClientPos = new Victor(x, y);
            let wheelClintPos = new Victor(canvasBounds.left, canvasBounds.top);
            let cursorPos = cursorClientPos.subtract(wheelClintPos);
            let lengthBounds = halfCanvas - this.$refs.cursor.clientWidth / 2;
            let baseIdx;
            let hex;

            this.cursorPos.copy(cursorPos);
            this.cursorPos.subtractScalar(halfCanvas);
            
            if (this.cursorPos.length() > lengthBounds){
                this.cursorPos.normalize();
                this.cursorPos.multiplyScalar(lengthBounds);
            }

            this.cursorPos.addScalar(halfCanvas).unfloat();

            baseIdx = Math.round(this.cursorPos.y * this.canvas.width * 4 + this.cursorPos.x * 4);
            hex = RGBAToHex(
                imgData[baseIdx + 0],
                imgData[baseIdx + 1],
                imgData[baseIdx + 2],
                255
            );

            this.$refs.cursor.style.left = this.cursorPos.x - halfSize + 'px';
            this.$refs.cursor.style.top = this.cursorPos.y - halfSize + 'px';
            this.selectedColor = hex;
            this.$refs.cursor.style.background = this.selectedColor;
        },
        moveCursorToColor(hex){
            let canvasBounds = this.canvas.getBoundingClientRect();
            let canvasPos = new Victor(canvasBounds.left, canvasBounds.top);
            let halfCanvas = this.canvas.width / 2;
            let rgb = hexToRGBA(hex);
            let hsv = RGBToHSV(rgb.r, rgb.g, rgb.b);
            let hueRad = hsv.hue * (Math.PI / 180)
            let pos = new Victor(-Math.cos(hueRad), Math.sin(hueRad)).multiplyScalar(hsv.sat * halfCanvas);

            pos.addScalar(halfCanvas);
            pos.add(canvasPos);
            this.updateCursorPos(pos.x, pos.y);
        },
        mouseDown(event){
            this.updateCursorPos(event.clientX, event.clientY);
            document.addEventListener("mousemove", this.mouseMove);
            this.$emit('change-start');
        },
        mouseUp(event){
            document.removeEventListener("mousemove", this.mouseMove);
            this.$emit('change-end');
        },
        mouseMove(event){
            this.updateCursorPos(event.clientX, event.clientY);
            this.$emit('changed');
        }
    }
}
</script>

<style scoped>
.wheelWrapper{
    position: relative;
}

.cursor{
    position: absolute;
    left: 0;
    top: 0;
    width: 20px;
    height: 20px;
    background: white;
    border: 2px solid black;
    border-radius: 50%;
    pointer-events: none;
}
</style>