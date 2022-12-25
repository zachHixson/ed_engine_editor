<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue';
import Core from '@/core';

const EXPAND = 1.15;

const { Draw, Vector } = Core;

const props = defineProps<{
    color: Core.Draw.Color,
    width: number,
}>();

const emit = defineEmits(['change-start', 'change', 'change-end']);

const canvasRef = ref<HTMLCanvasElement>();
const sliderRef = ref<HTMLElement>();
const cursorRef = ref<HTMLElement>();
const valueCursorRef = ref<HTMLElement>();
const valueCursorBGRef = ref<HTMLElement>();
const wheelBuffer = Draw.createHDPICanvas(props.width, props.width) as HTMLCanvasElement;
const valueBuffer = Draw.createHDPICanvas(props.width, props.width) as HTMLCanvasElement;
const circleBuffer = Draw.createHDPICanvas(props.width, props.width) as HTMLCanvasElement;
const cursorPos = new Vector(0, 0);
const valuePos = ref(1);
let selectedHS: Core.Draw.Color = props.color ?? new Draw.Color(255, 255, 255, 255);
let selectedColor: Core.Draw.Color = props.color ?? new Draw.Color(255, 255, 255, 255);

watch(props.color, newVal => {
    if (newVal != selectedColor){
        selectedColor = newVal;
        moveCursorToColor(selectedColor);
    }
});
watch(valuePos, ()=>composite());

onMounted(()=>{
    Draw.resizeHDPICanvas(canvasRef.value!, props.width, props.width);

    drawWheel();
    drawCircleBuff();
    composite();
    moveCursorToColor(selectedColor);
});

onBeforeUnmount(()=>{
    document.removeEventListener('mousemove', wheelMove as EventListener);
    document.removeEventListener('mousemove', valueMove);
    document.removeEventListener('mouseup', mouseUp);
});

function drawWheel(): void {
    const canvas = canvasRef.value!;
    const ctx = wheelBuffer.getContext('2d')!;
    const colors = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    let imgData;

    for (let i = 0; i < colors.length; i += 4){
        const posIdx = i / 4;
        const pos = new Vector(posIdx % canvas.width, Math.floor(posIdx / canvas.width));
        const relPos = new Vector(pos.x / canvas.width, pos.y / canvas.height).subtractScalar(0.5).multiplyScalar(2);
        const hue = (Math.atan2(relPos.y, relPos.x) + Math.PI) * (180 / Math.PI);
        const sat = relPos.length() * EXPAND;
        const val = 1;
        const rgb = Draw.HSVToRGB(hue, sat, val);

        colors[i + 0] = rgb.r;
        colors[i + 1] = rgb.g;
        colors[i + 2] = rgb.b;
        colors[i + 3] = 255;
    }

    imgData = new ImageData(colors, canvas.width);
    ctx.putImageData(imgData, 0, 0);
}

function drawCircleBuff(): void {
    const canvas = canvasRef.value!;
    const ctx = circleBuffer.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.fill();
}

function composite(): void {
    const canvas = canvasRef.value!;
    const ctx = canvas.getContext('2d')!;
    const valueCtx = valueBuffer.getContext('2d')!;
    const value = Math.round(valuePos.value * 255);

    //draw value canvas
    valueCtx.fillStyle = `rgb(${value},${value},${value})`;
    valueCtx.fillRect(0, 0, valueBuffer.width, valueBuffer.height);

    //composite
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(wheelBuffer, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(valueBuffer, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(circleBuffer, 0, 0);
}

function updateCursorPos(x: number, y: number): void {
    const canvas = canvasRef.value!;
    const halfCanvas = canvas.clientWidth / 2;
    const canvasBounds = canvas.getBoundingClientRect();
    const cursorClientPos = new Vector(x, y);
    const wheelClientPos = new Vector(canvasBounds.left, canvasBounds.top);
    const cursorPos = cursorClientPos.subtract(wheelClientPos);
    const lengthBounds = halfCanvas - cursorRef.value!.clientWidth / 2 - 3;

    cursorPos.copy(cursorPos);
    cursorPos.subtractScalar(halfCanvas);
    
    if (cursorPos.length() > lengthBounds){
        cursorPos.normalize();
        cursorPos.multiplyScalar(lengthBounds);
    }

    cursorPos.addScalar(halfCanvas).round();

    cursorRef.value!.style.left = cursorPos.x + 'px';
    cursorRef.value!.style.top = cursorPos.y + 'px';
    updateCursorColors();
}

function updateValuePos(x: number): void {
    const slider = sliderRef.value!;
    const valueCursor = valueCursorRef.value!;
    const halfCursorWidth = valueCursor.clientWidth / 2;
    const slideX = slider.getBoundingClientRect().left;
    const rBound = slider.clientWidth - valueCursor.clientWidth;
    let cursorX = x - slideX - halfCursorWidth;
    let fac;

    cursorX = Math.max(Math.min(cursorX, rBound), 0);
    fac = cursorX / rBound;

    valuePos.value = fac;
    valueCursor.style.left = cursorX + 'px';
    updateCursorColors();
}

function updateCursorColors(): void {
    const canvas = canvasRef.value!;
    const imgData = wheelBuffer.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    const dpiCorrectCursor = cursorPos.clone().multiplyScalar(devicePixelRatio).round();
    const baseIdx = Math.round(dpiCorrectCursor.y * canvas.width * 4 + dpiCorrectCursor.x * 4);
    const rgbArr = [
        imgData[baseIdx + 0],
        imgData[baseIdx + 1],
        imgData[baseIdx + 2],
    ];
    const hs = new Draw.Color().fromArray([...rgbArr, 255]);
    const hsv = new Draw.Color().fromArray([...rgbArr.map(i => Math.round(i * valuePos.value)), 255]);

    let myVal = hsv.toCSS();
    
    selectedColor = hsv;
    cursorRef.value!.style.background = selectedColor.toCSS();
    valueCursorBGRef.value!.style.background = selectedColor.toCSS();
    sliderRef.value!.style.backgroundImage = `linear-gradient(to right, black, ${hs.toCSS()})`;
}

function moveCursorToColor(rgba: Core.Draw.Color): void {
    const wheelBounds = canvasRef.value!.getBoundingClientRect();
    const wheelPos = new Vector(wheelBounds.left, wheelBounds.top);
    const sliderX = sliderRef.value!.getBoundingClientRect().left;
    const halfCanvas = canvasRef.value!.clientWidth / 2;
    const hsv = Draw.RGBToHSV(rgba.r, rgba.g, rgba.b);
    const hueRad = hsv.hue * (Math.PI / 180);
    const pos = new Vector(-Math.cos(hueRad), -Math.sin(hueRad)).multiplyScalar(hsv.sat * halfCanvas / EXPAND);

    pos.addScalar(halfCanvas);
    pos.add(wheelPos);
    updateCursorPos(pos.x, pos.y);
    updateValuePos((hsv.val * sliderRef.value!.clientWidth) + sliderX);
}

function wheelDown(event: MouseEvent): void {
    updateCursorPos(event.clientX, event.clientY);
    document.addEventListener('mousemove', wheelMove as EventListener);
    document.addEventListener('mouseup', mouseUp);
    emit('change-start');
    emit('change', selectedColor);
}

function valueDown(event: MouseEvent): void {
    updateValuePos(event.clientX);
    document.addEventListener('mousemove', valueMove);
    document.addEventListener('mouseup', mouseUp);
    emit('change-start');
}

function wheelMove(event: WheelEvent): void {
    updateCursorPos(event.clientX, event.clientY);
    emit('change', selectedColor);
}

function valueMove(event: MouseEvent): void {
    updateValuePos(event.clientX);
    emit('change', selectedColor);
}

function mouseUp(): void {
    document.removeEventListener('mousemove', wheelMove as EventListener);
    document.removeEventListener('mousemove', valueMove);
    document.removeEventListener('mouseup', mouseUp);
    emit('change-end', selectedColor);
}

const old = {
    methods: {
        
    }
}
</script>

<template>
    <div class="colorPicker">
        <div class="wheelWrapper">
            <canvas
                ref="canvasRef"
                class="canvas"
                @mousedown="wheelDown">
                //Error loading canvas
            </canvas>
            <div ref="cursorRef" class="cursor">
                <div class="cursorInside"></div>
            </div>
        </div>
        <div ref="sliderRef" class="valueSlider" @mousedown="valueDown">
            <div ref="valueCursorRef" class="valueCursor">
                <div class="valueCursorOutside" ref="valueCursorBG">
                    <div class="valueCursorInside"></div>
                </div>
            </div>
        </div>
    </div>
</template>

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