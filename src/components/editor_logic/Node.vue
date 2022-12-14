<template>
    <div class="node" :style="isSelected ? 'border-color: var(--button-norm)' : ''"
        @click="$emit('node-clicked', {nodeObj, jsEvent: $event})"
        @mousedown="mouseDown">
        <div class="heading" :style="'background:' + headingColor">
            <div v-if="nodeObj.isEvent" class="node-icon"><img src="@/assets/event.svg"/></div>
            <div>{{$t('node.' + nodeObj.templateId)}}</div>
        </div>
        <div v-if="!!nodeObj.widget" class="widgetWrapper">
            <Widget
                :widget="nodeObj.widget"
                :widgetData="widgetData"
                :setWidgetData="setWidgetData"/>
        </div>
        <div v-if="showTriggers" class="io">
            <div class="socket-column" style="align-items: flex-start">
                <Socket
                    v-for="inTrigger in inTriggerList"
                    :key="inTrigger.id"
                    ref="inTriggers"
                    :socket="inTrigger"
                    :isInput="true"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"/>
            </div>
            <div class="socket-column" style="align-items: flex-end">
                <Socket
                    v-for="outTrigger in outTriggerList"
                    :key="outTrigger.id"
                    ref="outTriggers"
                    :socket="outTrigger"
                    :isInput="false"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"/>
            </div>
        </div>
        <div v-if="showTriggers && showDataSockets" class="separator"></div>
        <div v-if="showDataSockets" class="io">
            <div class="socket-column"  style="align-items: flex-start">
                <Socket
                    v-for="input in inputList"
                    :key="input.id"
                    ref="inData"
                    :socket="input"
                    :isInput="true"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"
                    @on-input="onInput"
                    @value-changed="socketValueChanged"/>
            </div>
            <div class="socket-column" style="align-items: flex-end">
                <Socket
                    v-for="output in outputList"
                    :key="output.id"
                    ref="outData"
                    :socket="output"
                    :isInput="false"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"/>
            </div>
        </div>
    </div>
</template>

<script>
import Socket from './Socket';
import Widget from './Widget.vue';

export default {
    name: 'Node',
    props: ['nodeObj', 'clientToNavSpace', 'canDrag', 'selectedNodes', 'allConnections'],
    data(){
        return {
            dragOffset: new Victor(0, 0),
            mouseUpEvent: null,
            mouseMoveEvent: null,
            inTriggerList: [],
            outTriggerList: [],
            inputList: [],
            outputList: [],
        }
    },
    components: {
        Socket,
        Widget,
    },
    computed: {
        widgetData(){
            return this.nodeObj.widgetData;
        },
        showTriggers(){
            return this.inTriggerList.length > 0 || this.outTriggerList.length > 0;
        },
        showDataSockets(){
            return this.inputList.length > 0 || this.outputList.length > 0;
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
    created(){
        this.updateAllSockets();
    },
    mounted(){
        this.nodeObj.setDomRef(this.$el);
        this.mouseUpEvent = this.mouseUp.bind(this);
        this.updateConnections = this.updateConnections.bind(this);
        this.updateNodeSize = this.updateNodeSize.bind(this);

        this.nodeObj.addEventListener('onMove', this.updateConnections);
        this.nodeObj.addEventListener('recalcWidth', this.updateNodeSize);
        window.addEventListener('mouseup', this.mouseUpEvent);

        this.updateNodeSize();
        this.nodeObj.dispatchEvent(new CustomEvent("onMount"));
    },
    beforeDestroy(){
        window.removeEventListener('mouseup', this.mouseUpEvent);
        window.removeEventListener('mousemove', this.mouseMoveEvent);
        this.nodeObj.removeEventListener('onMove', this.updateConnections);
    },
    methods: {
        updateAllSockets(){
            this.updateInTriggerList();
            this.updateOutTriggerList();
            this.updateInputlist();
            this.updateOutputList();
        },
        updateInTriggerList(){
            this.inTriggerList = Array.from(this.nodeObj.inTriggers, ([id, trigger]) => trigger);
        },
        updateOutTriggerList(){
            this.outTriggerList = Array.from(this.nodeObj.outTriggers, ([id, trigger]) => trigger);
        },
        updateInputlist(){
            this.inputList = Array.from(this.nodeObj.inputs, ([id, input]) => input);
        },
        updateOutputList(){
            this.outputList = Array.from(this.nodeObj.outputs, ([id, output]) => output);
        },
        updateNodeSize(){
            this.$el.style.width = 'max-content';

            this.$nextTick(()=>{
                this.$el.style.width = this.$el.offsetWidth + 'px';
            });
        },
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
        setWidgetData(data){
            this.nodeObj.widgetData = data;
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
        socketValueChanged(event){
            event.node = this.nodeObj;
            this.$emit('socket-value-changed', event)
        },
        onInput(event){
            this.nodeObj.dispatchEvent(new CustomEvent('onInput', {detail: event}));
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
    border-radius:  8px 8px 0 0;
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