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
                stroke-width="12"
                fill="none"
                @mouseenter="mouseOver = !isDraggingAnotherConnection"
                @mouseleave="mouseOver = false"
                @mousedown="mouseDown"/>
        </svg>
    </div>
</template>

<script>
const PADDING = 20;
const HANDLE_WIDTH = 100;
const GRAB_DIST = 70;

export default {
    name: 'connection',
    props: ['connectionObj', 'clientToNavSpace', 'navWrapper', 'allConnections', 'draggingConnection'],
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
            navMousePos: new Victor(0, 0),
            mouseOver: false,
        }
    },
    computed: {
        flipVertical(){
            return (this.startPoint.y > this.endPoint.y);
        },
        isFullConnection(){
            let connection = this.connectionObj;
            return (connection.startSocketId != null && connection.endSocketId != null);
        },
        isDraggingAnotherConnection(){
            return (this.draggingConnection && this.draggingConnection != this.connectionObj);
        }
    },
    mounted(){
        this.mouseMoveHandler = this.mouseMove.bind(this);
        this.mouseDragHandler = this.mouseDrag.bind(this);
        this.connectionObj.connectionComponent = this;

        //Check if the connection is still in the process of being connected
        if (!this.isFullConnection){
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
        this.connectionObj.componentDestructor();
    },
    methods: {
        registerConnectEvents(){
            window.addEventListener('mousemove', this.mouseMoveHandler);
            window.addEventListener('mouseup', ()=>{
                window.removeEventListener('mousemove', this.mouseMoveHandler);
                this.mouseOver = false;
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

            this.$nextTick(()=>{
                this.update();
            });
        },
        setInitialMousePos(){
            let socketEl = this.connectionObj.startSocketEl ?? this.connectionObj.endSocketEl;
            let bounds = socketEl.getBoundingClientRect();
            let midPoint = this.centerFromBounds(bounds);
            let navMidPoint = this.clientToNavSpace(midPoint);

            this.navMousePos.copy(navMidPoint);
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
                this.startPoint.copy(this.navMousePos);
                return;
            }

            let bounds = this.connectionObj.startSocketEl.getBoundingClientRect();
            let clientCenter = this.centerFromBounds(bounds);
            this.startPoint.copy(this.clientToNavSpace(clientCenter));
        },
        updateEndPoint(){
            if (!this.connectionObj.endSocketEl){
                this.endPoint.copy(this.navMousePos);
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
            const Y_SHRINK_LIMIT = 200;

            let startCoord = this.navToSVGSpace(this.startPoint);
            let endCoord = this.navToSVGSpace(this.endPoint);
            let vPaddingDir = -this.flipVertical;
            let yShrinkFac = Math.min(this.startPoint.distance(this.endPoint), Y_SHRINK_LIMIT) / Y_SHRINK_LIMIT;
            let handleWidth = HANDLE_WIDTH * yShrinkFac;

            if (this.flipVertical){
                startCoord.y = this.height;
            }

            this.path = `M ${startCoord.x} ${startCoord.y + (vPaddingDir * PADDING)}
                         C ${startCoord.x + handleWidth + PADDING} ${startCoord.y + (vPaddingDir * PADDING)},
                           ${endCoord.x - handleWidth - PADDING} ${endCoord.y},
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

            if (distToEnd < GRAB_DIST){
                this.grabbedHandle = 1;
            }
            else if (distToStart < GRAB_DIST){
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

            let dragDistance = this.navMouseDown.distance(this.navMousePos);

            if (dragDistance > 5){
                this.$emit('drag-start', this.connectionObj);
                
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

            this.navMousePos.copy(navMousePos);
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
    },
}


</script>

<style scoped>
.connection{
    position: absolute;
    left: 0;
    top: 0;
}

.line{
    pointer-events: visibleStroke;
}
</style>