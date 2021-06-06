<template>
    <div ref="asset" class="asset" :class="{selected : isSelected}" @click="selectAsset">
        <div class="leftFloat" v-click-outside="stopRenaming">
            <canvas v-show="hasThumb" class="thumbnail" ref="thumbNail" width="20" height="20">Test</canvas>
            <inline-svg v-if="!hasThumb" class="thumbnail assetIcon" :src="require(`@/${defaultIcon}.svg`)"
                :transformSource="removeStroke"/>
            <div v-show="isRenaming">
                <input class="nameBox" ref="renameText" v-model="asset.name" type="text" />
            </div>
            <div class="nameBox" v-show="!isRenaming">{{asset.name}}</div>
        </div>
        <div class="rightFloat">
            <button class="rightButton" @click="(event)=>{event.stopPropagation(); this.isRenaming ? this.stopRenaming() : this.rename();}">
                <inline-svg class="rightIcon" style="width:30px; height:30px;" :src="require('@/assets/rename.svg')"
                    :transformSource="removeStroke"/>
            </button>
            <button class="rightButton" @click="deleteAsset">
                <inline-svg class="rightIcon" :src="require('@/assets/trash.svg')" :transformSource="removeStroke" />
            </button>
        </div>
    </div>
</template>

<script>
import Draw_2D from '@/common/Draw_2D';
import Util_2D from '@/common/Util_2D';
import {removeStroke} from '@/common/Util';

export default {
    name: 'Asset',
    props: ['asset', 'defaultIcon'],
    data(){
        return {
            isRenaming: false,
            dblClickCheck: false,
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

            isSelected |= (selectedAsset) ? selectedAsset.id == this.asset.id : false
            isSelected |= (selectedRoom) ? selectedRoom.id == this.asset.id : false

            return isSelected;
        }
    },
    mounted(){
        document.addEventListener('keydown', (event)=>{
            if (event.key == 'Enter'){
                this.isRenaming = false;
            }
        });

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

            if (this.dblClickCheck){
                this.rename();
            }
            else{
                this.$emit('selectAsset', this.asset);
                this.dblClickCheck = true;
                setTimeout(()=>{this.dblClickCheck = false}, 200);
            }
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
                let pixelDim = Util_2D.getSpriteDimensions(this.asset.thumbnailData);
                let scaleFac = canvas.width / pixelDim;

                Draw_2D.drawPixelData(this.pixelBuff, this.asset.thumbnailData);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                this.thumbLoading = true;
                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
                ctx.resetTransform();
                this.thumbLoading = false;
                this.checkThumb();
            }
        },
        removeStroke
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