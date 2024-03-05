<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Core from '@/core';

const EXPAND = 1.15;

const { Draw, Vector, WGL } = Core;

const props = defineProps<{
    color: Core.Draw.Color,
    width: number,
}>();

const emit = defineEmits(['change-start', 'change', 'change-end']);

const vertexSource = `
attribute vec4 a_position;

varying vec2 vPos;

void main(){
    vPos = a_position.xy;
    gl_Position = a_position;
}
`;

const fragmentSource = `
precision highp float;

uniform float u_value;

varying vec2 vPos;

const float PI = 3.141;

vec3 HSVToRGB(float h, float s, float v){
    float c = v * s;
    float x = c * (1.0 - abs(mod((h / 60.0), 2.0) - 1.0));
    float m = v - c;
    vec3 col;

    if (0.0 <= h && h < 60.0){
        col = vec3(c, x, 0);
    }
    else if (h < 120.0){
        col = vec3(x, c, 0);
    }
    else if (h < 180.0){
        col = vec3(0, c, x);
    }
    else if (h < 240.0){
        col = vec3(0, x, c);
    }
    else if (h < 300.0){
        col = vec3(x, 0, c);
    }
    else{
        col = vec3(c, 0, x);
    }

    return col + m;
}

void main(){
    vec2 pos = vec2(vPos.x, -vPos.y);
    float grad = length(pos);
    float circleMask = smoothstep(1.0, 0.98, grad);
    float angle = ((atan(pos.y, pos.x) + PI) / PI) * 180.0;
    vec3 HSV = HSVToRGB(angle, grad  * ${EXPAND.toFixed(2)}, 1.0);
    gl_FragColor = vec4(HSV * u_value, 1.0) * circleMask;
}
`;

const canvasRef = ref<HTMLCanvasElement>();
const sliderRef = ref<HTMLElement>();
const cursorRef = ref<HTMLElement>();
const valueCursorRef = ref<HTMLElement>();
const valueCursorBGRef = ref<HTMLElement>();
const wheelBuffer = Draw.createHDPICanvas(props.width, props.width) as HTMLCanvasElement;
const cursorPos = new Vector(0, 0);
const valuePos = ref(1);
let selectedColor: Core.Draw.Color = props.color ?? new Draw.Color(255, 255, 255, 255);

//wgl setup
const wheelCtx = WGL.getGLContext(wheelBuffer)!;
const wheelProgram = WGL.compileProgram(
    wheelCtx,
    vertexSource,
    fragmentSource,
);
const valueUniform = new WGL.Uniform(wheelCtx, wheelProgram, 'u_value', WGL.Uniform_Types.FLOAT)!;
const positionAttribute = new WGL.Attribute(wheelCtx, wheelProgram, 'a_position');
const planeGeo = WGL.createPlaneGeo();
const vao = wheelCtx.createVertexArray();

wheelCtx.bindVertexArray(vao);
positionAttribute.set(new Float32Array(planeGeo), 2);
positionAttribute.enable();

wheelCtx.viewport(0, 0, wheelBuffer.width, wheelBuffer.height);
wheelCtx.clearColor(0, 0, 0, 0);

watch(()=>props.color, newVal => {
    if (!newVal.compare(selectedColor)){
        selectedColor = newVal;
        moveCursorToColor(selectedColor);
    }
});
watch(valuePos, ()=>drawWheel());

onMounted(()=>{
    Draw.resizeHDPICanvas(canvasRef.value!, props.width, props.width);

    nextTick(()=>{
        drawWheel();
        moveCursorToColor(selectedColor);
    })
});

onBeforeUnmount(()=>{
    document.removeEventListener('mousemove', wheelMove as EventListener);
    document.removeEventListener('mousemove', valueMove);
    document.removeEventListener('mouseup', mouseUp);
});

function drawWheel(): void {
    const canvasCtx = canvasRef.value!.getContext('2d')!;

    wheelCtx.clear(wheelCtx.COLOR_BUFFER_BIT);
    wheelCtx.useProgram(wheelProgram);
    wheelCtx.bindVertexArray(vao);
    valueUniform.set(valuePos.value);
    wheelCtx.drawArrays(wheelCtx.TRIANGLES, 0, 6);

    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
    canvasCtx.drawImage(wheelBuffer, 0, 0);
}

function updateCursorPos(x: number, y: number): void {
    const canvas = canvasRef.value!;
    const halfCanvas = canvas.clientWidth / 2;
    const canvasBounds = canvas.getBoundingClientRect();
    const cursorClientPos = new Vector(x, y);
    const wheelClientPos = new Vector(canvasBounds.left, canvasBounds.top);
    const relCursorPos = cursorClientPos.subtract(wheelClientPos);
    const lengthBounds = halfCanvas - cursorRef.value!.clientWidth / 2 - 3;

    cursorPos.copy(relCursorPos);
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
    const cursor = cursorRef.value!;
    const canvasBounds = canvas.getBoundingClientRect();
    const cursorBounds = cursor.getBoundingClientRect();
    const canvasCenter = new Vector(canvasBounds.right + canvasBounds.left, canvasBounds.bottom + canvasBounds.top).divideScalar(2);
    const cursorCenter = new Vector(cursorBounds.right + cursorBounds.left, cursorBounds.bottom + cursorBounds.top).divideScalar(2);
    const dirVector = cursorCenter.clone().subtract(canvasCenter);
    const h = ((Math.atan2(dirVector.y, dirVector.x) + Math.PI) / Math.PI) * 180;
    const s = dirVector.length() * EXPAND;
    const v = valuePos.value;
    const rgb = Draw.HSVToRGB(h, Math.min(s / (canvas.width / 2), 1), 1.0);
    const hs = new Draw.Color(rgb.r, rgb.g, rgb.b);
    const hsv = new Draw.Color(Math.round(rgb.r * v), Math.round(rgb.g * v), Math.round(rgb.b * v));
    
    selectedColor = hsv;
    cursor.style.background = selectedColor.toCSS();
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
    emit('change', selectedColor);
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

function doubleClick(): void {
    const white = new Core.Draw.Color(255, 255, 255);
    selectedColor = white;
    moveCursorToColor(white);
    emit('change-end', selectedColor);
}
</script>

<template>
    <div class="colorPicker">
        <div class="wheelWrapper">
            <canvas
                ref="canvasRef"
                class="canvas"
                @dblclick="doubleClick"
                @mousedown="wheelDown">
                //Error loading canvas
            </canvas>
            <div ref="cursorRef" class="cursor">
                <div class="cursorInside"></div>
            </div>
        </div>
        <div ref="sliderRef" class="valueSlider" @mousedown="valueDown">
            <div ref="valueCursorRef" class="valueCursor">
                <div class="valueCursorOutside" ref="valueCursorBGRef">
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

.colorPicker > * {
    user-select: none;
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