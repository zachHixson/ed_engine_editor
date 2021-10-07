<template>
    <div class="node"
        @mousedown="mouseDown">
        <div class="heading">
            {{nodeObj.templateId}}
            <div class="triggers">
                <div class="socket-column">
                    <div
                        v-for="inTrigger in inTriggers"
                        :key="inTrigger"
                        class="socket socket-left">
                        <div>&lt;</div>
                        <div>{{inTrigger}}</div>
                    </div>
                </div>
                <div class="socket-column">
                    <div
                        v-for="outTrigger in outTriggers"
                        :key="outTrigger"
                        class="socket socket-right">
                        <div>{{outTrigger}}</div>
                        <div>&gt;</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="body">
            <div class="sockets">
                <div class="socket-column">
                    <div
                        v-for="input in inputs"
                        :key="input.id"
                        class="socket">
                        i
                    </div>
                </div>
                <div class="socket-column">
                    <div
                        v-for="output in outputs"
                        :key="output.id"
                        class="socket">
                        <div>o</div>
                        <div>&gt;</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Victor from 'victor';

export default {
    name: 'Node',
    props: ['nodeObj', 'viewport', 'navWrapper', 'canDrag'],
    data(){
        return {
            idDragging: false,
            dragOffset: new Victor(0, 0),
            mouseUpEvent: null,
            mouseMoveEvent: null,
        }
    },
    computed: {
        inTriggers(){
            //return Array.from(this.nodeObj.inTriggers, ([id]) => {return id});
            return ['12345', '2', '3']
        },
        outTriggers(){
            //return Array.from(this.nodeObj.outTriggers, ([id]) => {return id});
            return ['12345', '2', '3']
        },
        inputs(){
            return Array.from(this.nodeObj.inputs, ([id, input]) => {return {
                id,
                type: input.type,
                value: input.value,
            }});
        },
        outputs(){
            return Array.from(this.nodeObj.outputs, ([id, input]) => {return {
                id,
                type: input.type,
                value: input.value,
            }});
        },
    },
    mounted(){
        this.nodeObj.setDomRef(this.$el);
        this.mouseUpEvent = this.mouseUp.bind(this);
        this.mouseMoveEvent = this.mouseMove.bind(this);

        window.addEventListener('mouseup', this.mouseUpEvent);
        window.addEventListener('mousemove', this.mouseMoveEvent);
    },
    beforeDestroy(){
        window.removeEventListener('mouseup', this.mouseUpEvent);
        window.removeEventListener('mousemove', this.mouseMoveEvent);
    },
    methods: {
        mouseDown(event){
            if (event.which == 1 && this.canDrag){
                let mousePos = new Victor(event.clientX, event.clientY);
                let nodeBounds = this.$el.getBoundingClientRect();
                let nodeOrigin = new Victor(nodeBounds.left + nodeBounds.right, nodeBounds.top + nodeBounds.bottom).divideScalar(2);
                this.dragOffset.copy(nodeOrigin.clone().subtract(mousePos));
                this.isDragging = true;
            }
        },
        mouseUp(){
            if (this.isDragging = true){
                this.$emit('node-moved');
            }

            this.isDragging = false;
        },
        mouseMove(event){
            if (this.isDragging){
                /*
                    - Calculate mouse's viewport position (based on "client space", so that the hierarchy is irrelivent)
                    - Calculate the mouse's position in the navWrapper in percentage (IE: x:50%, y:25%)
                    - Multiply percentage by viewport dimensions to get mouse position in "nav space" (viewport and
                      navWrapper dimensions will always be the same since CSS scale does not change pixel values of width/height)
                */
                let vpBounds = this.viewport.getBoundingClientRect();
                let vpOrigin = new Victor(vpBounds.left, vpBounds.top);
                let vpSize = new Victor(vpBounds.right - vpBounds.left, vpBounds.bottom - vpBounds.top);
                let mousePos = new Victor(event.clientX, event.clientY).subtract(vpOrigin).add(this.dragOffset);
                let navBounds = this.navWrapper.getBoundingClientRect();
                let navOrigin = new Victor(navBounds.left, navBounds.top).subtract(vpOrigin);
                let navSize = new Victor(navBounds.right - navBounds.left, navBounds.bottom - navBounds.top);
                let navPercent = mousePos.clone().subtract(navOrigin).divide(navSize);
                let nodeVpPos = vpSize.clone().multiply(navPercent);

                this.nodeObj.setPos(nodeVpPos);
            }
        },
    }
}
</script>

<style scoped>
.node{
    position: absolute;
    left: 0;
    top: 0;
    min-width: 100px;
    transform: translate(-50%, -50%);
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    overflow: hidden;
    user-select: none;
    pointer-events: all;
}

.heading{
    background: var(--heading);
}

.triggers{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
}

.sockets{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
}

.socket-column{
    display: flex;
    flex-direction: column;
}

.socket{
    display: flex;
    flex-direction: row;
}

.socket-left{
    justify-content: flex-start;
}

.socket-right{
    justify-content: flex-end;
}
</style>