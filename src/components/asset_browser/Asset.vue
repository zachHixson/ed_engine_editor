<template>
    <div ref="asset" class="asset" :class="{selected : isSelected}" @click="selectAsset">
        <div class="leftFloat" v-click-outside="stopRenaming">
            <canvas v-show="thumbnail" class="thumbnail" ref="thumbNail" width="20" height="20" draggable="false">Error</canvas>
            <img v-if="!thumbnail" class="thumbnail assetIcon" :src="require(`@/${defaultIcon}.svg`)" draggable="false"/>
            <div v-show="isRenaming">
                <input class="nameBox" ref="renameText" v-model="asset.name" type="text" v-input-active/>
            </div>
            <div class="nameBox" v-show="!isRenaming">{{asset.name}}</div>
        </div>
        <div class="rightFloat">
            <button class="rightButton" @click="(event)=>{event.stopPropagation(); this.isRenaming ? this.stopRenaming() : this.rename();}">
                <img class="rightIcon" style="width:30px; height:30px;" src="@/assets/rename.svg" draggable="false"/>
            </button>
            <button class="rightButton" @click="deleteAsset">
                <img class="rightIcon" src="@/assets/trash.svg" draggable="false"/>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Asset',
    props: ['asset', 'defaultIcon', 'visibilityObserver'],
    data(){
        return {
            isRenaming: false,
            oldName: null,
            thumbnail: null,
            observer: null,
            isVisible: false,
        }
    },
    computed: {
        isSelected(){
            let selectedAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];
            let selectedRoom = this.$store.getters['AssetBrowser/getSelectedRoom'];
            let isSelected = false;

            isSelected |= (selectedAsset) ? selectedAsset.id == this.asset.id : false;
            isSelected |= (selectedRoom) ? selectedRoom.id == this.asset.id : false;

            return !!isSelected;
        }
    },
    mounted(){
        const observableOptions = {
            root: this.$parent.$el,
            rootMargin: '0px',
            threshold: 1.0
        };

        this.observer = new IntersectionObserver((entry)=>{
            this.isVisible = entry[0].isIntersecting;
            this.drawThumbnail();
        }, observableOptions);
        this.observer.observe(this.$el);
        this.$refs.asset.addEventListener('dblclick', this.rename);
        this.drawThumbnail();
    },
    beforeDestroy(){
        document.removeEventListener('keydown', this.onEnterPress);
    },
    methods: {
        deleteAsset(event){
            event.stopPropagation();
            this.isRenaming = false;
            this.$emit('deleteAsset', this.asset);
        },
        selectAsset(event){
            event.preventDefault();
            this.$emit('selectAsset', this.asset);
        },
        rename(){
            this.isRenaming = true;
            this.oldName = this.asset.name;
            document.addEventListener('keydown', this.onEnterPress);
            this.$nextTick(()=>{
                this.$refs.renameText.focus();
                this.$refs.renameText.select();
            }, 10);
        },
        stopRenaming(){
            if (this.isRenaming){
                this.isRenaming = false;
                this.$emit('renamed', {asset: this.asset, oldName: this.oldName});
                document.removeEventListener('keydown', this.onEnterPress);
            }
        },
        onEnterPress(event){
            if (event.key == 'Enter'){
                this.stopRenaming();
            }
        },
        drawThumbnail(){
            this.thumbnail = this.asset.thumbnail;

            if (this.thumbnail && this.isVisible){
                let canvas = this.$refs.thumbNail;
                let ctx = canvas.getContext('2d');
                let scaleFac = canvas.width / this.thumbnail.width;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.thumbnail, 0, 0, this.thumbnail.width, this.thumbnail.height);
                ctx.resetTransform();
            }
        }
    }
}
</script>

<style scoped>
.asset{
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    padding: 5px;
    border-radius: var(--corner-radius);
    background: var(--main-bg)
}

.nameBox{
    min-width: 0;
    max-width: 8em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.selected{
    background: var(--selection);
}

.leftFloat{
    display: flex;
    align-items: center;
}

.rightFloat{
    display: flex;
    align-items: center;
}

.rightButton{
    background: none;
    padding: 0;
    border: none;
}

.thumbnail{
    margin: 5px;
}

.assetIcon{
    width: 20px;
    height: 20px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}

.rightIcon{
    width: 20px;
    height: 20px;
    margin: 3px;
    stroke: var(--button-icon);
}
</style>