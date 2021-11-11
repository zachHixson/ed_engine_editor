<template>
    <div class="connection">
        <svg :width="width" :height="height" ref="svg">
            <filter id="blur" x="-20%" y="-20%" width="150%" height="150%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>

            <!--blurred line-->
            <path
                v-if="mouseOver && isFullConnection"
                :d="path"
                stroke="gray"
                stroke-width="2"
                fill="none"
                filter="url(#blur)"/>

            <!--main line-->
            <path
                :d="path"
                stroke="gray"
                stroke-width="2"
                fill="none"
                :style="mouseOver && isFullConnection ? 'stroke: #444444' : ''"/>

            <!--invisible line that's thicker to use for hover detection-->
            <path
                v-if="isFullConnection"
                class="line"
                :d="path"
                stroke="none"
                stroke-width="8"
                fill="none"
                @mouseenter="mouseOver = true"
                @mouseleave="mouseOver = false"
                @mousedown="mouseDown"/>
        </svg>
    </div>
</template>

<script>
import Victor from 'victor';
import {SOCKET_TYPE} from '@/common/data_classes/Node_Enums';

const PADDING = 20;
const HANDLE_WIDTH = 100;
const HANDLE_DIST = 70;

export default {
    name: 'connection',
    props: ['connectionObj', 'clientToNavSpace', 'navWrapper', 'curSocketOver', 'allConnections'],
    data(){
        return {
            startPoint: new Victor(0, 0),
            endPoint: new Victor(0, 0),
            width: 0,
            height: 0,
            cssOrigin: new Victor(0, 0),
            path: "",
            mouseMoveHandler: null,
            mouseDragHandler: null,
            grabbedHandle: null,
            navMouseDown: new Victor(0, 0),
            mousePos: new Victor(0, 0),
            mouseOver: false,
        }
    },
    computed: {
        flipVertical(){
            return (this.startPoint.y > this.endPoint.y);
        },
        isPartialConnection(){
            let connection = this.connectionObj;
            return (!!connection.startSocketEl ^ !!connection.endSocketEl)
        },
        isFullConnection(){
            let connection = this.connectionObj;
            return (!!connection.startSocketEl && !!connection.endSocketEl);
        },
    },
    mounted(){
        this.mouseMoveHandler = this.mouseMove.bind(this);
        this.mouseDragHandler = this.mouseDrag.bind(this);
        this.connectionObj.connectionComponent = this;

        //Check if the connection is still in the process of being connected
        if (this.isPartialConnection){
            this.registerConnectEvents();
            this.$nextTick(()=>{
                this.setInitialMousePos();
                this.update();
            });
        }
    },
    beforeDestroy(){
        window.removeEventListener('mousemove', this.mouseMoveHandler);
        window.removeEventListener('mousemove', this.mouseDragHandler);
        this.connectionObj.startSocketEl = null;
        this.connectionObj.endSocketEl = null;
        this.connectionObj.registerUpdateCallback = null;
    },
    methods: {
        registerConnectEvents(){
            window.addEventListener('mousemove', this.mouseMoveHandler);
            window.addEventListener('mouseup', ()=>{
                window.removeEventListener('mousemove', this.mouseMoveHandler);
                this.connectSocket();
            }, {once: true});
        },
        relink(nodeInfoMap){
            let start = nodeInfoMap.get(this.connectionObj.startNode.nodeId);
            let end = nodeInfoMap.get(this.connectionObj.endNode.nodeId);
            let startSocketEl = start.sockets.get(this.connectionObj.startSocketId);
            let endSocketEl = end.sockets.get(this.connectionObj.endSocketId);

            this.connectionObj.canConnect = true;
            this.connectionObj.startSocketEl = startSocketEl.$refs.socketConnection;
            this.connectionObj.endSocketEl = endSocketEl.$refs.socketConnection;

            this.update();
        },
        setInitialMousePos(){
            if (this.connectionObj.startSocketEl){
                let startSocketBounds = this.connectionObj.startSocketEl.getBoundingClientRect();
                let midPoint = this.centerFromBounds(startSocketBounds);
                this.mousePos.copy(midPoint);
            }
            else{
                let endSocketBounds = this.connectionObj.endSocketEl.getBoundingClientRect();
                let midPoint = this.centerFromBounds(endSocketBounds);
                this.mousePos.copy(midPoint);
            }
        },
        update(){
            this.updateStartPoint();
            this.updateEndPoint();
            this.updateWidth();
            this.updateHeight();
            this.updateCSSPos();
            this.updatePath();
        },
        updateStartPoint(){
            if (!this.connectionObj.startSocketEl){
                this.startPoint.copy(this.mousePos);
                return;
            }

            let bounds = this.connectionObj.startSocketEl.getBoundingClientRect();
            let clientCenter = this.centerFromBounds(bounds);
            this.startPoint.copy(this.clientToNavSpace(clientCenter));
        },
        updateEndPoint(){
            if (!this.connectionObj.endSocketEl){
                this.endPoint.copy(this.mousePos);
                return;
            }

            let bounds = this.connectionObj.endSocketEl.getBoundingClientRect();
            let clientCenter = this.centerFromBounds(bounds);
            this.endPoint.copy(this.clientToNavSpace(clientCenter));
        },
        updateWidth(){
            let minX = Math.min(this.startPoint.x, this.endPoint.x - HANDLE_WIDTH) - PADDING;
            let maxX = Math.max(this.startPoint.x + HANDLE_WIDTH, this.endPoint.x) + PADDING;
            this.width = Math.abs(minX - maxX);
        },
        updateHeight(){
            this.height = Math.abs(this.startPoint.y - this.endPoint.y) + (2 * PADDING);
        },
        updateCSSPos(){
            let minX = Math.min(this.startPoint.x, this.endPoint.x - HANDLE_WIDTH);
            let minY = Math.min(this.startPoint.y, this.endPoint.y);

            this.cssOrigin.x = minX - PADDING;
            this.cssOrigin.y = minY - PADDING;

            this.$el.style.left = this.cssOrigin.x + 'px';
            this.$el.style.top = this.cssOrigin.y + 'px';
        },
        updatePath(){
            let startCoord = this.navToSVGSpace(this.startPoint);
            let endCoord = this.navToSVGSpace(this.endPoint);
            let vPaddingDir = -this.flipVertical;

            if (this.flipVertical){
                startCoord.y = this.height;
            }

            this.path = `M ${startCoord.x} ${startCoord.y + (vPaddingDir * PADDING)}
                         C ${startCoord.x + HANDLE_WIDTH + PADDING} ${startCoord.y + (vPaddingDir * PADDING)},
                           ${endCoord.x - HANDLE_WIDTH - PADDING} ${endCoord.y},
                           ${endCoord.x} ${endCoord.y}`;
        },
        mouseDown(event){
            if (event.which != 1){
                return;
            }

            let clientMouseDown = new Victor(event.clientX, event.clientY);
            this.navMouseDown.copy(this.clientToNavSpace(clientMouseDown));
            let distToStart = this.navMouseDown.distance(this.startPoint);
            let distToEnd = this.navMouseDown.distance(this.endPoint);

            if (distToEnd < HANDLE_DIST){
                this.grabbedHandle = 1;
            }
            else if (distToStart < HANDLE_DIST){
                this.grabbedHandle = -1;
            }

            if (this.grabbedHandle){
                window.addEventListener('mousemove', this.mouseDragHandler);
                window.addEventListener('mouseup', ()=>{
                    window.removeEventListener('mousemove', this.mouseDragHandler);
                }, {once: true});
            }
        },
        mouseMove(event){
            this.updateMousePos(event);
            this.update();
        },
        mouseDrag(event){
            this.updateMousePos(event);

            let dragDistance = this.navMouseDown.distance(this.mousePos);

            if (dragDistance > 5){
                if (this.grabbedHandle == 1){
                    this.connectionObj.endSocketId = null;
                    this.connectionObj.endSocketEl = null;
                }
                else{
                    this.connectionObj.startSocketId = null;
                    this.connectionObj.startSocketEl = null;
                }

                this.registerConnectEvents();
                this.grabbedHandle = null;
                window.removeEventListener('mousemove', this.mouseDragHandler);
            }
        },
        updateMousePos(event){
            let clientMousePos = new Victor(event.clientX, event.clientY);
            let navMousePos = this.clientToNavSpace(clientMousePos);

            this.mousePos.copy(navMousePos);
        },
        centerFromBounds(bounds){
            let ul = new Victor(bounds.left, bounds.top);
            let br = new Victor(bounds.right, bounds.bottom);
            let midPoint = ul.add(br).divideScalar(2);
            
            return midPoint;
        },
        navToSVGSpace(point){
            return point.clone().subtract(this.cssOrigin);
        },
        connectSocket(){
            let typeMatch = this.curSocketOver?.socketData.type == this.connectionObj.type;
            let anyMatch = this.curSocketOver?.socketData.type == SOCKET_TYPE.ANY && !!this.connectionObj.type;
            let directionMatch = !!this.connectionObj.startSocketEl == !!this.curSocketOver?.isInput;

            if (!(
                this.curSocketOver &&
                (typeMatch || anyMatch) &&
                directionMatch &&
                this.connectionObj.canConnect &&
                this.curSocketOver.canConnect
            )){
                this.$emit('remove-connection', this.connectionObj.id);
                return;
            }

            if (this.curSocketOver.isInput){
                this.connectionObj.endNode = this.curSocketOver.node;
                this.connectionObj.endSocketId = this.curSocketOver.socketData.id;
                this.connectionObj.endSocketEl = this.curSocketOver.socketEl;
            }
            else{
                this.connectionObj.startNode = this.curSocketOver.node;
                this.connectionObj.startSocketId = this.curSocketOver.socketData.id;
                this.connectionObj.startSocketEl = this.curSocketOver.socketEl;
            }

            this.mouseOver = false;

            this.$nextTick(()=>{
                this.checkLoop();
                this.update();
            });
        },
        checkLoop(){
            let connectionMap = new Map();
            let checkedNodes = new Map();

            for (let i = 0; i < this.allConnections.length; i++){
                let connection = this.allConnections[i];
                let id = connection.startNode.nodeId + '/' + connection.startSocketId;
                connectionMap.set(id, connection);
            }

            if (_checkLoop(this.connectionObj, connectionMap, checkedNodes)){
                this.$emit('remove-connection', this.connectionObj.id);
            }
        }
    },
}

function _checkLoop(connection, connectionMap, checkedNodes){
    let curNode = connection.endNode;
    let socketArr = [];

    if (checkedNodes.get(curNode.nodeId)){
        return true;
    }

    checkedNodes.set(curNode.nodeId, true);

    curNode.outTriggers?.forEach(trigger => socketArr.push(trigger));
    curNode.outputs?.forEach(output => socketArr.push(output));

    for (let i = 0; i < socketArr.length; i++){
        let socket = socketArr[i];
        let connectionPath = curNode.nodeId + '/' + socket.id;
        let nextConnection = connectionMap.get(connectionPath);

        if (nextConnection){
            return _checkLoop(nextConnection, connectionMap, checkedNodes);
        }
    }

    return false;
}
</script>

<style scoped>
.connection{
    position: absolute;
    left: 0;
    top: 0;
}

.line{
    pointer-events: visible;
}
</style>