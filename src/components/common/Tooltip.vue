<template>
    <div v-show="showTooltip" ref="tooltip" class="tooltip">
        <div ref="positionWrapper"
            class="position-wrapper">
            <div v-html="text" ref="messageText" class="message-text" :style="`left: ${hOffset}px`">
            </div>
            <svg width="20" height="15" class="arrow">
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
                const textBounds = this.$refs.messageText.getBoundingClientRect();
                const windowBorder = document.documentElement.clientWidth;
                const rOverflow = Math.min(0, windowBorder - textBounds.right);
                const lOverflow = Math.max(0, -textBounds.left);

                this.hOffset = rOverflow + lOverflow;
            });
        },
    }
}
</script>

<style scoped>
.tooltip{
    position: absolute;
    top: 3px;
    width: 100%;
    height: 100%;
    flex-direction: column;
    pointer-events: none;
}

.position-wrapper{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: min-content;
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
    top: -2px;
    fill: lightgrey;
    stroke: var(--border);
    stroke-width: 2px;
}
</style>