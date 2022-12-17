<template>
    <div v-show="showTooltip" ref="tooltip" class="tooltip" :class="invert ? 'tooltip-below':'tooltip-above'">
        <div ref="positionWrapper"
            class="position-wrapper"
            :class="invert ? 'below':'above'">
            <svg v-if="invert" width="20" height="15" class="arrow arrow-top">
                <path d="M0 15 L10 0 L20 15"/>
            </svg>
            <div ref="messageText" class="message-text" :style="`left: ${hOffset}px`">
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
const HOVER_TIME = 0.8;

export default {
    name: "Tooltip",
    props: ['for', 'text'],
    data(){
        return {
            showTooltip: false,
            timeout: null,
            hOffset: 0,
            invert: false,
        }
    },
    mounted(){
        const parentEl = this.$el.parentElement;
        this.siblingEntered = this.siblingEntered.bind(this);
        this.siblingLeft = this.siblingLeft.bind(this);

        for (let i = 0; i < parentEl.childNodes.length; i++){
            const child = parentEl.childNodes[i];

            if (child.name == this.for){
                child.addEventListener('mouseover', this.siblingEntered);
                child.addEventListener('mouseout', this.siblingLeft);
            }
        }
    },
    beforeDestroy(){
        const parentEl = this.$el.parentElement;

        for (let i = 0; i < parentEl?.childNodes.length; i++){
            const child = parentEl.childNodes[i];
            child.removeEventListener('mouseover', this.siblingEntered);
            child.removeEventListener('mouseout', this.siblingLeft);
        }
    },
    methods: {
        siblingEntered(){
            const timeLimit = HOVER_TIME * 1000;

            if (!this.text.length){
                return;
            }

            this.timeout = setTimeout(()=>{
                console.log("Show")
                this.showTooltip = true;
                this.recalculateOffset();
            }, timeLimit);
        },
        siblingLeft(){
            clearTimeout(this.timeout);
            this.showTooltip = false;
        },
        recalculateOffset(){
            this.$nextTick(()=>{
                this.hOffset = this.getTextOffset();
                this.invert = this.getInvertedState();
            });
        },
        getTextOffset(){
            const textBounds = this.$refs.messageText.getBoundingClientRect();
            const windowBorder = document.documentElement.clientWidth;
            const rOverflow = Math.min(0, windowBorder - textBounds.right);
            const lOverflow = Math.max(0, -textBounds.left);

            return rOverflow + lOverflow;
        },
        getInvertedState(){
            const parentEl = this.$el.parentElement;
            const parentBounds = parentEl.getBoundingClientRect();
            const textBounds = this.$refs.messageText.getBoundingClientRect();
            const textHeight = textBounds.bottom - textBounds.top;

            return textHeight > parentBounds.top;
        }
    }
}
</script>

<style scoped>
.tooltip{
    position: absolute;
    width: 100%;
    height: 100%;
    flex-direction: column;
    pointer-events: none;
    z-index: 1000;
}

.tooltip-above{
    top: 3px;
}

.tooltip-below{
    top: -3px;
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

.below{
    transform: translateY(100%);
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