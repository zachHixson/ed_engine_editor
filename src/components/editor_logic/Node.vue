<template>
    <div class="node" :style="isSelected ? 'border-color: var(--button-norm)' : ''"
        @mousedown="mouseDown">
        <div class="heading">
            <div class="node-name">{{$t('node.' + nodeObj.templateId)}}</div>
            <div class="io">
                <div class="socket-column" style="align-items: flex-start">
                    <Socket
                        v-for="inTrigger in inTriggers"
                        :key="inTrigger"
                        ref="inTriggers"
                        :socket="{id: inTrigger}"
                        :isInput="true"
                        @mouse-down="socketDown"
                        @socket-over="socketOver"/>
                </div>
                <div class="socket-column" style="align-items: flex-end">
                    <Socket
                        v-for="outTrigger in outTriggers"
                        :key="outTrigger"
                        ref="outTriggers"
                        :socket="{id: outTrigger}"
                        :isInput="false"
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
    props: ['nodeObj', 'clientToNavSpace', 'canDrag', 'selectedNodes'],
    data(){
        return {
            idDragging: false,
            dragOffset: new Victor(0, 0),
            mouseUpEvent: null,
            mouseMoveEvent: null,
            connections: [],
        }
    },
    components: {
        Socket,
    },
    computed: {
        inTriggers(){
            return Array.from(this.nodeObj.inTriggers, ([id]) => {return id});
        },
        outTriggers(){
            return Array.from(this.nodeObj.outTriggers, ([id]) => {return id});
        },
        inputs(){
            return Array.from(this.nodeObj.inputs, ([id, input]) => {return {
                id,
                type: input.type,
                input,
            }});
        },
        outputs(){
            return Array.from(this.nodeObj.outputs, ([id, input]) => {return {
                id,
                type: input.type,
            }});
        },
        isSelected(){
            return this.selectedNodes.find(nodeObj => nodeObj.nodeId == this.nodeObj.nodeId) != undefined;
        },
    },
    mounted(){
        this.nodeObj.setDomRef(this.$el);
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
            this.$emit("mouse-down", this.nodeObj);

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
                let navPos = this.clientToNavSpace(mousePos);

                this.nodeObj.setPos(navPos);
                this.updateConnections();
            }
        },
        socketDown(connection){
            let socket = connection.startSocketEl ?? connection.endSocketEl;

            if (socket.isInput){
                connection.endNode = this.nodeObj;
            }
            else{
                connection.startNode = this.nodeObj;
            }

            connection.registerUpdateCallback = this.registerUpdate.bind(this);

            this.$emit('socket-down', connection);
        },
        socketOver(event){
            if (event){
                event.node = this.nodeObj;
                event.registerUpdateCallback = this.registerUpdate.bind(this);
            }
            
            this.$emit('socket-over', event);
        },
        registerUpdate(connectionEl){
            this.connections.push(connectionEl);
        },
        updateConnections(){
            for (let i = 0; i < this.connections.length; i++){
                this.connections[i].update();
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