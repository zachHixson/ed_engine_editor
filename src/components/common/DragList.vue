<template>
    <div>
        <div
            class="drag-line"
            :class="hasMoved ? 'drag-line-animation':''"
            :style="`
                ${dragIdx == -1 ? 'display: none;':''}
                height: ${(hoverIdx == -1) * elHeight}px;
            `">
            <div :idx="-1" :style="`height: ${elHeight}px`" class="hover-boundary"></div>
        </div>
        <div
            v-for="(item, idx) in assembled"
            name="instancedItem"
            :ref="keys[idx]"
            :key="keys[idx]"
            :idx="idx"
            @mousedown="mouseDown">
            <div
                :style="`
                    transition: height 0.1s;
                    ${dragIdx == idx ? 'opacity: 0; height:' + elHeight +'px;':''}
                    ${dragIdx == idx && hasMoved ? 'height: 0px;':''}
                `">
                <slot name="item" v-bind="item"></slot>
            </div>
            <div
                class="drag-line"
                :class="hasMoved ? 'drag-line-animation':''"
                :style="`
                    ${dragIdx == idx ? 'display: none;':''}
                    height: ${(hoverIdx == idx) * elHeight}px;
                `">
                <div :idx="idx" :style="`height: ${elHeight}px`" class="hover-boundary"></div>
            </div>
        </div>
    </div>
</template>

<script>
const DRAG_DIST = 20;

export default {
    name: "DragList",
    props: ['items', 'keylist'],
    data(){
        return {
            elHeight: 0,
            hoverIdx: null,
            downEl: null,
            dragEl: null,
            dragIdx: null,
            boundMouseMoveEvent: null,
            boundMouseUpEvent: null,
            boundHandleScroll: null,
            mouseDownPos: null,
            mousePos: new Victor(-5, -5),
            dragOffset: new Victor(0, 0),
            isDragging: false,
            hasMoved: false,
            overY: 0,
        }
    },
    computed: {
        assembled(){
            this.$nextTick(()=>{
                const elKey = this.keys[0];
                const randEl = this.$refs[elKey];
                this.elHeight = randEl ? randEl[0].clientHeight : 0;
            });

            return this.items.map((item, idx) => {return {item, index: idx}});
        },
        isSamePos(){
            return this.hoverIdx == this.dragIdx || this.hoverIdx == this.dragIdx - 1 || this.hoverIdx == null;
        },
        keys(){
            return this.keylist ?? this.items.map(i => i.id);
        },
    },
    mounted(){
        this.boundMouseMoveEvent = this.mouseMove.bind(this);
        this.boundMouseUpEvent = this.mouseUp.bind(this);
        this.boundHandleScroll = this.handleScroll.bind(this);
        document.addEventListener('mousemove', this.boundMouseMoveEvent);
        document.addEventListener('mouseup', this.boundMouseUpEvent);
    },
    beforeDestroy(){
        document.removeEventListener('mousemove', this.boundMouseMoveEvent);
        document.removeEventListener('mouseup', this.boundMouseUpEvent);
    },
    methods: {
        mouseDown(event){
            const topLevelEl = this.getItemParent(event.target);
            const elBounds = topLevelEl.getBoundingClientRect();

            event.preventDefault();
            this.mouseDownPos = new Victor(event.clientX, event.clientY);
            this.downEl = topLevelEl;
            this.dragOffset.copy(this.mouseDownPos).subtract(new Victor(elBounds.left, elBounds.top));
        },
        mouseMove(event){
            const listBounds = this.$el.parentNode.getBoundingClientRect();
            const {clientX, clientY} = event;

            //update mouse position
            this.mousePos.x = clientX;
            this.mousePos.y = clientY;

            //detect if mouse has left the bounds of the list
            if (
                this.mousePos.x > listBounds.right ||
                this.mousePos.x < listBounds.left ||
                this.mousePos.y > listBounds.bottom ||
                this.mousePos.y < listBounds.top
            ){
                const overTop = -Math.max(listBounds.top - this.mousePos.y, 0);
                const underBottom = Math.max(this.mousePos.y - listBounds.bottom, 0);

                this.overY = overTop + underBottom;
                this.hoverIdx = null;
            }
            else{
                this.overY = 0;
            }

            //check which separator item is being dragged over
            if (this.isDragging){
                this.handleScroll();
                this.updateDragIdx();
            }

            //check if mouse has started dragging
            if (this.mouseDownPos){
                const distance = this.mouseDownPos.distance(this.mousePos);
                
                if (distance > DRAG_DIST && !this.isDragging){
                    this.dragStart();
                }
            }

            //if mouse is already dragging update dragEl position
            if (this.dragEl){
                const newPos = this.mousePos.clone().subtract(this.dragOffset);
                this.dragEl.style.left = newPos.x + 'px';
                this.dragEl.style.top = newPos.y + 'px';
            }
        },
        mouseUp(){
            this.mouseDownPos = null;
            this.hasMoved = false;

            if (this.isDragging){
                this.dragEnd();
            }
        },
        dragStart(){
            this.isDragging = true;
            this.dragEl = this.cloneEl(this.downEl);
            this.dragIdx = parseInt(this.dragEl.getAttribute('idx'));
            this.hoverIdx = this.dragIdx;

            this.dragEl.style.position = 'absolute';
            this.dragEl.style.top = '0px';
            this.dragEl.style.left = '0px';
            this.dragEl.style.zIndex = '2000';
            document.body.append(this.dragEl);
        },
        dragEnd(){
            const newIdx = this.dragIdx < this.hoverIdx ? this.hoverIdx : this.hoverIdx + 1;

            if (this.hoverIdx != null && !this.isSamePos){
                this.$emit('order-changed', {
                    itemIdx: this.dragIdx,
                    newIdx
                });
            }

            this.hoverIdx = null;
            this.downEl = null;
            this.dragIdx = null;
            this.isDragging = false;
            this.dragEl.parentNode.removeChild(this.dragEl);
        },
        handleScroll(){
            if (this.overY != 0 && this.isDragging){
                const scrollAmt = this.overY * devicePixelRatio * 0.1;
                this.$el.parentNode.scrollBy(0, scrollAmt);
                requestAnimationFrame(this.boundHandleScroll);
            }
        },
        updateDragIdx(){
            const separators = this.getSeparatorChildren(this.$el);
            
            for (let i = 0; i < separators.length; i++){
                const bounds = separators[i].getBoundingClientRect();
                const {x, y} = this.mousePos;

                if (
                    x > bounds.left &&
                    x < bounds.right &&
                    y > bounds.top &&
                    y < bounds.bottom
                ){
                    this.hoverIdx = parseInt(separators[i].getAttribute('idx'));
                    this.hasMoved |= this.hoverIdx != this.dragIdx;
                }
            }

            this.hasMoved = !!this.hasMoved;
        },
        getItemParent(item){
            if (item.getAttribute('name') == 'instancedItem'){
                return item;
            }
            else{
                return this.getItemParent(item.parentNode);
            }
        },
        getSeparatorChildren(el){
            const separators = [];

            for (let i = 0; i < el.childNodes.length; i++){
                const child = el.childNodes[i];

                if (el.childNodes[i].className == 'hover-boundary'){
                    separators.push(child);
                }
                else{
                    separators.push(...this.getSeparatorChildren(child));
                }
            }

            return separators;
        },
        getCanvasChildren(el){
            const canvases = [];

            for (let i = 0; i < el.childNodes.length; i++){
                const child = el.childNodes[i];

                if (child.tagName == 'CANVAS'){
                    canvases.push(child);
                }

                canvases.push(...this.getCanvasChildren(child));
            }

            return canvases;
        },
        cloneEl(el){
            const clone = el.cloneNode(true);
            const originalCanvases = this.getCanvasChildren(el);
            const cloneCanvases = this.getCanvasChildren(clone);

            clone.style.width = el.clientWidth + 'px';
            clone.style.height = el.clientHeight + 'px';

            for (let i = 0; i < originalCanvases.length; i++){
                const ctx = cloneCanvases[i].getContext('2d');
                ctx.drawImage(originalCanvases[i], 0, 0);
            }

            return clone;
        },
    }
}
</script>

<style scoped>
.drag-line{
    display: block;
    position: relative;
    width: 100%;
    pointer-events: none;
}

.drag-line-animation{
    transition: height 0.1s;
}

.hover-boundary{
    position: absolute;
    width: 100%;
    transform: translateY(-50%);
    pointer-events: none;
}
</style>