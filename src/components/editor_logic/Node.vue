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
    props: ['nodeObj', 'clientToNav', 'canDrag'],
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
                let mousePos = new Victor(event.clientX, event.clientY).add(this.dragOffset);
                let navPos = this.clientToNav(mousePos);

                this.nodeObj.setPos(navPos);
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