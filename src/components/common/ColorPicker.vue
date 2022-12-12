<template>
    <div class="colorPicker">
        <div class="wheelWrapper">
            <canvas
                ref="canvas"
                class="canvas"
                @mousedown="wheelDown">
                //Error loading canvas
            </canvas>
            <div ref="cursor" class="cursor">
                <div class="cursorInside"></div>
            </div>
        </div>
        <div ref="slider" class="valueSlider" @mousedown="valueDown">
            <div ref="valueCursor" class="valueCursor">
                <div class="valueCursorOutside" ref="valueCursorBG">
                    <div class="valueCursorInside"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const EXPAND = 1.15;

export default {
    name: 'ColorPicker',
    props: ['color', 'width'],
    data(){
        return {
            canvas: null,
            slider: null,
            wheelBuffer: null,
            valueBuffer: null,
            circleBuffer: null,
            cursorPos: new Victor(0, 0),
            valuePos: 1,
            selectedHS: this.color ?? new Shared.Color(255, 255, 255, 255),
            selectedColor: this.color ?? new Shared.Color(255, 255, 255, 255),
        }
    },
    watch: {
        color(newVal){
            if (newVal != this.selectedColor){
                this.selectedColor = newVal;
                this.moveCursorToColor(this.selectedColor);
            }
        },
        valuePos(){
            this.composite();
        },
    },
    mounted(){
        this.canvas = this.$refs.canvas;
        this.slider = this.$refs.slider;

        let canvasDim = this.width;
        Shared.resizeHDPICanvas(this.canvas, this.width, this.width);
        this.wheelBuffer = Shared.createHDPICanvas(canvasDim, canvasDim);
        this.valueBuffer = Shared.createHDPICanvas(canvasDim, canvasDim);
        this.circleBuffer = Shared.createHDPICanvas(canvasDim, canvasDim);

        this.drawWheel();
        this.drawCircleBuff();
        this.composite();
        this.moveCursorToColor(this.selectedColor);
    },
    beforeDestroy(){
        document.removeEventListener('mousemove', this.wheelMove);
        document.removeEventListener('mousemove', this.valueMove);
        document.removeEventListener('mouseup', this.mouseUp);
    },
    methods: {
        drawWheel(){
            let ctx = this.wheelBuffer.getContext('2d');
            let colors = new Uint8ClampedArray(this.canvas.width * this.canvas.height * 4);
            let imgData;

            for (let i = 0; i < colors.length; i += 4){
                let posIdx = i / 4;
                let pos = new Victor(posIdx % this.canvas.width, Math.floor(posIdx / this.canvas.width));
                let relPos = new Victor(pos.x / this.canvas.width, pos.y / this.canvas.height).subtractScalar(0.5).multiplyScalar(2);
                let hue = (Math.atan2(relPos.y, relPos.x) + Math.PI) * (180 / Math.PI);
                let sat = relPos.length() * EXPAND;
                let val = 1;
                let rgb = Shared.HSVToRGB(hue, sat, val);

                colors[i + 0] = rgb.r;
                colors[i + 1] = rgb.g;
                colors[i + 2] = rgb.b;
                colors[i + 3] = 255;
            }

            imgData = new ImageData(colors, this.canvas.width);
            ctx.putImageData(imgData, 0, 0);
        },
        drawCircleBuff(){
            let ctx = this.circleBuffer.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2, 0, Math.PI * 2);
            ctx.fill();
        },
        composite(){
            let ctx = this.canvas.getContext('2d');
            let valueCtx = this.valueBuffer.getContext('2d');
            let value = Math.round(this.valuePos * 255);

            //draw value canvas
            valueCtx.fillStyle = `rgb(${value},${value},${value})`;
            valueCtx.fillRect(0, 0, this.valueBuffer.width, this.valueBuffer.height);

            //composite
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(this.wheelBuffer, 0, 0);
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(this.valueBuffer, 0, 0);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(this.circleBuffer, 0, 0);
        },
        updateCursorPos(x, y){
            let canvas = this.$refs.canvas;
            let halfCanvas = canvas.clientWidth / 2;
            let canvasBounds = canvas.getBoundingClientRect();
            let cursorClientPos = new Victor(x, y);
            let wheelClientPos = new Victor(canvasBounds.left, canvasBounds.top);
            let cursorPos = cursorClientPos.subtract(wheelClientPos);
            let lengthBounds = halfCanvas - this.$refs.cursor.clientWidth / 2 - 3;

            this.cursorPos.copy(cursorPos);
            this.cursorPos.subtractScalar(halfCanvas);
            
            if (this.cursorPos.length() > lengthBounds){
                this.cursorPos.normalize();
                this.cursorPos.multiplyScalar(lengthBounds);
            }

            this.cursorPos.addScalar(halfCanvas).unfloat();

            this.$refs.cursor.style.left = this.cursorPos.x + 'px';
            this.$refs.cursor.style.top = this.cursorPos.y + 'px';
            this.updateCursorColors();
        },
        updateValuePos(x){
            let halfCursorWidth = this.$refs.valueCursor.clientWidth / 2;
            let slideX = this.slider.getBoundingClientRect().left;
            let cursorX = x - slideX - halfCursorWidth;
            let rBound = this.slider.clientWidth - this.$refs.valueCursor.clientWidth;
            let fac;

            cursorX = Math.max(Math.min(cursorX, rBound), 0);
            fac = cursorX / rBound;

            this.valuePos = fac;
            this.$refs.valueCursor.style.left = cursorX + 'px';
            this.updateCursorColors();
        },
        updateCursorColors(){
            let imgData = this.wheelBuffer.getContext('2d').getImageData(0, 0, this.canvas.width, this.canvas.height).data;
            let dpiCorrectCursor = this.cursorPos.clone().multiplyScalar(devicePixelRatio).unfloat();
            let baseIdx = Math.round(dpiCorrectCursor.y * this.canvas.width * 4 + dpiCorrectCursor.x * 4);
            let rgbArr = [
                imgData[baseIdx + 0],
                imgData[baseIdx + 1],
                imgData[baseIdx + 2],
            ];
            let hs = new Shared.Color().fromArray([...rgbArr, 255]);
            let hsv = new Shared.Color().fromArray([...rgbArr.map(i => Math.round(i * this.valuePos)), 255]);
            
            this.selectedColor = hsv;
            this.$refs.cursor.style.background = this.selectedColor.toCSS();
            this.$refs.valueCursorBG.style.background = this.selectedColor.toCSS();
            this.slider.style.backgroundImage = `linear-gradient(to right, black, ${hs.toCSS()})`;
        },
        moveCursorToColor(rgba){
            let wheelBounds = this.canvas.getBoundingClientRect();
            let wheelPos = new Victor(wheelBounds.left, wheelBounds.top);
            let sliderX = this.slider.getBoundingClientRect().left;
            let halfCanvas = this.canvas.clientWidth / 2;
            let hsv = Shared.RGBToHSV(rgba.r, rgba.g, rgba.b);
            let hueRad = hsv.hue * (Math.PI / 180);
            let pos = new Victor(-Math.cos(hueRad), -Math.sin(hueRad)).multiplyScalar(hsv.sat * halfCanvas / EXPAND);

            pos.addScalar(halfCanvas);
            pos.add(wheelPos);
            this.updateCursorPos(pos.x, pos.y);
            this.updateValuePos((hsv.val * this.slider.clientWidth) + sliderX);
        },
        wheelDown(event){
            this.updateCursorPos(event.clientX, event.clientY);
            document.addEventListener('mousemove', this.wheelMove);
            document.addEventListener('mouseup', this.mouseUp);
            this.$emit('change-start');
            this.$emit('change', this.selectedColor);
        },
        valueDown(event){
            this.updateValuePos(event.clientX);
            document.addEventListener('mousemove', this.valueMove);
            document.addEventListener('mouseup', this.mouseUp);
            this.$emit('change-start');
        },
        wheelMove(event){
            this.updateCursorPos(event.clientX, event.clientY);
            this.$emit('change', this.selectedColor);
        },
        valueMove(event){
            this.updateValuePos(event.clientX);
            this.$emit('change', this.selectedColor);
        },
        mouseUp(){
            document.removeEventListener('mousemove', this.wheelMove);
            document.removeEventListener('mousemove', this.valueMove);
            document.removeEventListener('mouseup', this.mouseUp);
            this.$emit('change-end', this.selectedColor);
        },
    }
}
</script>

<style scoped>
.colorPicker{
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wheelWrapper{
    position: relative;
}

.cursor{
    position: absolute;
    left: 0;
    top: 0;
    box-sizing: border-box;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid black;
    border-radius: 50%;
    pointer-events: none;
}

.cursorInside{
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 2px solid white;
    border-radius: 50%;
}

.valueSlider{
    position: relative;
    width: 100%;
    height: 30px;
    border-radius: 500px;
    background-image: linear-gradient(to right, black, white);
}

.valueCursor{
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    border-radius: 50%;
}

.valueCursorOutside{
    box-sizing: border-box;
    width: 80%;
    height: 80%;
    border: 2px solid black;
    border-radius: 50%;
}

.valueCursorInside{
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border:2px solid white;
    border-radius: 50%;
}
</style>