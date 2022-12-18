<template>
    <div
        v-show="showTooltip"
        ref="tooltip"
        class="tooltip"
        :style="`
            position: absolute;
            left: ${x}px;
            top: ${y}px;
        `">
        <div ref="positionWrapper"
            class="position-wrapper"
            :class="invert ? 'below':'above'">
            <svg v-if="invert" width="20" height="15" class="arrow arrow-top">
                <path d="M0 15 L10 0 L20 15"/>
            </svg>
            <div ref="messageText" class="message-text" :style="`transform: translateX(${hOffset}px)`">
                <div v-if="invert" class="arrow-blocker">
                    <svg v-if="invert" width="20" height="15">
                        <path d="M0 15 L10 0 L20 15"/>
                    </svg>
                </div>
                <div v-html="text"></div>
            </div>
            <svg v-if="!invert" width="20" height="15" class="arrow arrow-bottom">
                <path d="M0 0 L10 15 L20 0"/>
            </svg>
        </div>
    </div>
</template>

<script>
export default {
    name: "Tooltip",
    data(){
        return {
            HOVER_TIME: 0.8,
            x: 0,
            y: 0,
            showTooltip: false,
            timeout: null,
            hOffset: 0,
            invert: false,
            text: '',
        }
    },
    beforeCreate(){
        getTooltipComponent = getTooltipComponent.bind(this);
        showTooltip = showTooltip.bind(this);
        hideTooltip = hideTooltip.bind(this);
    },
}

export function getTooltipComponent(){
    return this;
}

export function showTooltip(el){
    const elBounds = el.getBoundingClientRect();
    
    this.x = (elBounds.left + elBounds.right) / 2;
    this.showTooltip = true;
    this.$nextTick(()=>{
        recalculateOffsets(this, el);
    });
}

export function hideTooltip(){
    clearTimeout(this.timeout);
    this.showTooltip = false;
}

function recalculateOffsets(tooltipComp, el){
    setClientYPos(tooltipComp, el);
    tooltipComp.hOffset = getTextOffset(tooltipComp);
    tooltipComp.invert = getInvertedState(tooltipComp, el);
}

function setClientYPos(tooltipComp, el){
    const elBounds = el.getBoundingClientRect();
    tooltipComp.y = getInvertedState(tooltipComp, el) ? elBounds.bottom : elBounds.top;
}

function getTextOffset(tooltipComp){
    const textBounds = tooltipComp.$refs.messageText.getBoundingClientRect();
    const windowBorder = document.documentElement.clientWidth;
    const rOverflow = Math.min(0, windowBorder - textBounds.right);
    const lOverflow = Math.max(0, -textBounds.left);

    return rOverflow + lOverflow;
};

function getInvertedState(tooltipComp, el){
    const elBounds = el.getBoundingClientRect();
    const textBounds = tooltipComp.$refs.messageText.getBoundingClientRect();
    const textHeight = textBounds.bottom - textBounds.top;

    return textHeight > elBounds.top;
}
</script>

<style scoped>
.tooltip{
    position: absolute;
    flex-direction: column;
    pointer-events: none;
    z-index: 1000;
}

.position-wrapper{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: min-content;
}

.above{
    transform: translateY(-100%);
}

.message-text{
    position: relative;
    height: max-content;
    width: max-content;
    max-width: 300px;
    padding: 10px;
    background: lightgrey;
    border: 2px solid var(--border);
    border-radius: 10px;
}

.arrow{
    position: relative;
    fill: lightgrey;
    stroke: var(--border);
    stroke-width: 2px;
}

.arrow-top{
    top: 2px;
}

.arrow-bottom{
    bottom: 2px;
}

.arrow-blocker{
    position: absolute;
    top: 0;
    left: 50%;
}

.arrow-blocker > *{
    transform: translate(-50%, -90%);
    top: -3px;
    fill: lightgrey;
}
</style>