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
    props: ['nodeObj'],
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
    methods: {
        mouseDown(event){
            this.$emit('mouse-down');
            
            let parentBounds = this.$parent.$el.getBoundingClientRect();
            let mousePos = new Victor(event.clientX - parentBounds.left, event.clientY - parentBounds.top);
            let origin = this.nodeObj.pos.clone();
            this.dragOffset.copy(origin.clone().subtract(mousePos));
            this.isDragging = true;
        },
        mouseUp(){
            this.isDragging = false;
        },
        mouseMove(event){
            if (this.isDragging){
                let parentBounds = this.$parent.$el.getBoundingClientRect();
                let mousePos = new Victor(event.clientX - parentBounds.left, event.clientY - parentBounds.top).add(this.dragOffset);
                this.nodeObj.setPos(mousePos);
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