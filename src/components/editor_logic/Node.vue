<template>
    <div class="node" :style="isSelected ? 'border-color: var(--button-norm)' : ''"
        @click="$emit('node-clicked', {nodeObj, jsEvent: $event})"
        @mousedown="mouseDown">
        <div class="heading" :style="'background:' + headingColor">
            <div v-if="nodeObj.isEvent" class="node-icon"><img src="@/assets/event.svg"/></div>
            <div>{{$t('node.' + nodeObj.templateId)}}</div>
        </div>
        <div v-if="showTriggers" class="io">
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
        <div v-if="showTriggers && showDataSockets" class="separator"></div>
        <div v-if="showDataSockets" class="io">
            <div class="socket-column"  style="align-items: flex-start">
                <Socket
                    v-for="input in inputs"
                    :key="input.id"
                    ref="inData"
                    :socket="input"
                    :isInput="true"
                    :parentConnections="connections"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"
                    @value-changed="$emit('socket-value-changed', $event)"/>
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
        showTriggers(){
            return this.inTriggers.length > 0 || this.outTriggers.length > 0;
        },
        showDataSockets(){
            return this.inputs.length > 0 || this.outputs.length > 0;
        },
        isSelected(){
            return this.selectedNodes.find(nodeObj => nodeObj.nodeId == this.nodeObj.nodeId) != undefined;
        },
        connections(){
            return this.allConnections.filter(
                c => (c.startNode?.nodeId == this.nodeObj.nodeId || c.endNode?.nodeId == this.nodeObj.nodeId)
            );
        },
        headingColor(){
            if (this.nodeObj.isEvent){
                return '#DF554B';
            }

            return getComputedStyle(document.body).getPropertyValue('--heading');
        }
    },
    mounted(){
        this.nodeObj.setDomRef(this.$el);
        this.nodeObj.updateConnectionsCallback = this.updateConnections.bind(this);
        this.mouseUpEvent = this.mouseUp.bind(this);

        window.addEventListener('mouseup', this.mouseUpEvent);

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
            if (event.which == 1){
            this.$emit("node-down", this.nodeObj);

                if (this.canDrag){
                    let mousePos = new Victor(event.clientX, event.clientY);
                    let nodeBounds = this.$el.getBoundingClientRect();
                    let nodeOrigin = new Victor(nodeBounds.left + nodeBounds.right, nodeBounds.top + nodeBounds.bottom).divideScalar(2);
                    this.dragOffset.copy(nodeOrigin.clone().subtract(mousePos));
                    this.isDragging = true;
                }
            }
        },
        mouseUp(){
            if (this.isDragging == true){
                this.$emit('node-move-end');
            }

            this.isDragging = false;
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
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
    padding-bottom: 5px;
    padding: 5px;
}

.node-icon{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
}

.node-icon > img{
    width: auto;
    height: auto;
}

.separator{
    border-bottom: 2px solid #00000033;
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