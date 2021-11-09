<template>
    <div class="connection">
        <svg :width="width" :height="height" ref="svg">
            <path
                ref="line"
                :width="width"
                :height="height"
                :d="path"
                stroke="black"
                fill="none"/>
        </svg>
    </div>
</template>

<script>
import Victor from 'victor';
import {SOCKET_TYPE} from '@/common/data_classes/Node_Enums';

const PADDING = 5;
const HANDLE_WIDTH = 100;

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
            mousePos: new Victor(0, 0),
        }
    },
    computed: {
        flipVertical(){
            return (this.startPoint.y > this.endPoint.y);
        },
    },
    mounted(){
        this.mouseMoveHandler = this.mouseMove.bind(this);
        this.connectionObj.connectionComponent = this;

        //Check if the connection is still in the process of being connected
        if (!!this.connectionObj.startSocketEl ^ !!this.connectionObj.endSocketEl){
            window.addEventListener('mousemove', this.mouseMoveHandler);
            window.addEventListener('mouseup', ()=>{
                window.removeEventListener('mousemove', this.mouseMoveHandler);
                this.connectSocket();
            }, {once: true});

            this.$nextTick(()=>{
                this.setInitialMousePos();
                this.update();
            });
        }
    },
    beforeDestroy(){
        window.removeEventListener('mousemove', this.mouseMoveHandler);
        this.connectionObj.startSocketEl = null;
        this.connectionObj.endSocketEl = null;
        this.connectionObj.registerUpdateCallback = null;
    },
    methods: {
        relink(nodeInfoMap){
            let start = nodeInfoMap.get(this.connectionObj.startNode.nodeId);
            let end = nodeInfoMap.get(this.connectionObj.endNode.nodeId);
            let startSocketEl = start.sockets.get(this.connectionObj.startSocketId);
            let endSocketEl = end.sockets.get(this.connectionObj.endSocketId);

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
        mouseMove(event){
            let clientMousePos = new Victor(event.clientX, event.clientY);
            this.mousePos.copy(this.clientToNavSpace(clientMousePos));
            this.update();
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
</style>