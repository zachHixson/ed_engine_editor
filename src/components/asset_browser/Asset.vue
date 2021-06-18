<template>
    <div ref="asset" class="asset" :class="{selected : isSelected}" @click="selectAsset">
        <div class="leftFloat" v-click-outside="stopRenaming">
            <canvas v-show="hasThumb" class="thumbnail" ref="thumbNail" width="20" height="20">Error</canvas>
            <img v-if="!hasThumb" class="thumbnail assetIcon" :src="require(`@/${defaultIcon}.svg`)"/>
            <div v-show="isRenaming">
                <input class="nameBox" ref="renameText" v-model="asset.name" type="text" />
            </div>
            <div class="nameBox" v-show="!isRenaming">{{asset.name}}</div>
        </div>
        <div class="rightFloat">
            <button class="rightButton" @click="(event)=>{event.stopPropagation(); this.isRenaming ? this.stopRenaming() : this.rename();}">
                <img class="rightIcon" style="width:30px; height:30px;" src="@/assets/rename.svg"/>
            </button>
            <button class="rightButton" @click="deleteAsset">
                <img class="rightIcon" src="@/assets/trash.svg"/>
            </button>
        </div>
    </div>
</template>

<script>
import {drawPixelData} from '@/common/Draw_2D';
import {getSpriteDimensions} from '@/common/Util_2D';

export default {
    name: 'Asset',
    props: ['asset', 'defaultIcon'],
    data(){
        return {
            isRenaming: false,
            hasThumb: false,
            thumbLoading: false,
            pixelBuff: document.createElement('canvas')
        }
    },
    computed: {
        isSelected(){
            let selectedAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];
            let selectedRoom = this.$store.getters['AssetBrowser/getSelectedRoom'];
            let isSelected = false;

            isSelected |= (selectedAsset) ? selectedAsset.id == this.asset.id : false;
            isSelected |= (selectedRoom) ? selectedRoom.id == this.asset.id : false;

            return isSelected;
        }
    },
    mounted(){
        document.addEventListener('keydown', (event)=>{
            if (event.key == 'Enter'){
                this.isRenaming = false;
            }
        });

        this.$refs.asset.addEventListener('dblclick', this.rename)

        this.pixelBuff.width = 16;
        this.pixelBuff.height = 16;

        this.drawThumbnail();
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
            this.$nextTick(()=>{
                this.$refs.renameText.focus();
                this.$refs.renameText.select();
            }, 10);
        },
        stopRenaming(){
            this.isRenaming = false;
        },
        checkThumb(){
            let result = this.asset.thumbnailData && !this.thumbLoading;
            this.hasThumb = result;
            return result;
        },
        drawThumbnail(){
            if (this.checkThumb()){
                let canvas = this.$refs.thumbNail;
                let ctx = canvas.getContext('2d');
                let pixelDim = getSpriteDimensions(this.asset.thumbnailData);
                let scaleFac = canvas.width / pixelDim;

                drawPixelData(this.pixelBuff, this.asset.thumbnailData);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                this.thumbLoading = true;
                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
                ctx.resetTransform();
                this.thumbLoading = false;
                this.checkThumb();
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