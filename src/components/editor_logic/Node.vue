<template>
    <div class="node" :style="isSelected ? 'border-color: var(--button-norm)' : ''"
        @click="$emit('node-clicked', {nodeObj, jsEvent: $event})"
        @mousedown="mouseDown">
        <div class="heading">
            <div class="node-name">{{$t('node.' + nodeObj.templateId)}}</div>
            <div class="io">
                <div class="socket-column" style="align-items: flex-start">
                    <Socket
                        v-for="inTrigger in inTriggers"
                        :key="inTrigger.id"
                        ref="inTriggers"
                        :socket="inTrigger"
                        :isInput="true"
                        :parentConnections="connections"
                        @mouse-down="socketDown"
                        @socket-over="socketOver"/>
                </div>
                <div class="socket-column" style="align-items: flex-end">
                    <Socket
                        v-for="outTrigger in outTriggers"
                        :key="outTrigger.id"
                        ref="outTriggers"
                        :socket="outTrigger"
                        :isInput="false"
                        :parentConnections="connections"
                        @mouse-down="socketDown"
                        @socket-over="socketOver"/>
                </div>
            </div>
        </div>
        <div class="body">
            <div class="io">
                <div class="socket-column"  style="align-items: flex-start">
                    <Socket
                        v-for="input in inputs"
                        :key="input.id"
                        ref="inData"
                        :socket="input"
                        :isInput="true"
                        :parentConnections="connections"
                        @mouse-down="socketDown"
                        @socket-over="socketOver"/>
                </div>
                <div class="socket-column" style="align-items: flex-end">
                    <Socket
                        v-for="output in outputs"
                        :key="output.id"
                        ref="outData"
                        :socket="output"
                        :isInput="false"
                        :parentConnections="connections"
                        @mouse-down="socketDown"
                        @socket-over="socketOver"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import Socket from './Socket';

export default {
    name: 'Node',
    props: ['nodeObj', 'clientToNavSpace', 'canDrag', 'selectedNodes', 'allConnections'],
    data(){
        return {
            idDragging: false,
            dragOffset: new Victor(0, 0),
            mouseUpEvent: null,
            mouseMoveEvent: null,
        }
    },
    components: {
        Socket,
    },
    computed: {
        inTriggers(){
            return Array.from(this.nodeObj.inTriggers, ([id, trigger]) => trigger);
        },
        outTriggers(){
            return Array.from(this.nodeObj.outTriggers, ([id, trigger]) => trigger);
        },
        inputs(){
            return Array.from(this.nodeObj.inputs, ([id, input]) => input);
        },
        outputs(){
            return Array.from(this.nodeObj.outputs, ([id, input]) => input);
        },
        isSelected(){
            return this.selectedNodes.find(nodeObj => nodeObj.nodeId == this.nodeObj.nodeId) != undefined;
        },
        connections(){
            return this.allConnections.filter(
                c => (c.startNode?.nodeId == this.nodeObj.nodeId || c.endNode?.nodeId == this.nodeObj.nodeId)
            );
        }
    },
    mounted(){
        this.nodeObj.setDomRef(this.$el);
        this.nodeObj.updateConnectionsCallback = this.updateConnections.bind(this);
        this.mouseUpEvent = this.mouseUp.bind(this);
        this.mouseMoveEvent = this.mouseMove.bind(this);

        window.addEventListener('mouseup', this.mouseUpEvent);
        window.addEventListener('mousemove', this.mouseMoveEvent);

        this.$nextTick(()=>{
            this.$el.style.width = this.$el.offsetWidth + 'px';
        });
    },
    beforeDestroy(){
        window.removeEventListener('mouseup', this.mouseUpEvent);
        window.removeEventListener('mousemove', this.mouseMoveEvent);
    },
    methods: {
        mouseDown(event){
            this.$emit("node-down", this.nodeObj);

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
                this.$emit('node-move-end');
            }

            this.isDragging = false;
        },
        mouseMove(event){
            if (this.isDragging){
                let startPos = this.nodeObj.pos.clone();
                let mousePos = new Victor(event.clientX, event.clientY).add(this.dragOffset);
                let navPos = this.clientToNavSpace(mousePos);
                let velocity = navPos.clone().subtract(startPos);

                this.$emit('node-moved', velocity);
            }
        },
        socketDown(connection){
            let isInput = !connection.startSocketEl;

            if (isInput){
                connection.endNode = this.nodeObj;
            }
            else{
                connection.startNode = this.nodeObj;
            }

            this.$emit('socket-down', connection);
        },
        socketOver(event){
            if (event){
                event.node = this.nodeObj;
            }
            
            this.$emit('socket-over', event);
        },
        updateConnections(){
            for (let i = 0; i < this.connections.length; i++){
                this.connections[i].connectionComponent.update();
            }
        },
        getRelinkInfo(){
            let inTriggers = this.$refs.inTriggers ?? [];
            let outTriggers = this.$refs.outTriggers ?? [];
            let inData = this.$refs.inData ?? [];
            let outData = this.$refs.outData ?? [];
            let allSocketEls = [...inTriggers, ...outTriggers, ...inData, ...outData];
            let socketElMap = new Map();

            allSocketEls.forEach(socketEl => {
                socketElMap.set(socketEl.socket.id, socketEl);
            });

            return {
                id: this.nodeObj.nodeId,
                el: this,
                sockets: socketElMap,
            }
        },
    }
}
</script>

<style scoped>
.node{
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0;
    top: 0;
    width: max-content;
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
    padding-bottom: 5px;
    background: var(--heading);
}

.node-name{
    padding: 5px;
}

.io{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding-top: 5px;
    padding-bottom: 5px;
}

.socket-column{
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
}
</style>