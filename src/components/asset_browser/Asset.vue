<template>
    <div ref="asset" class="asset" :class="{selected : isSelected}" @click="selectAsset">
        <div class="leftFloat">
            <canvas v-show="hasThumb" class="thumbnail" ref="thumbNail" width="20" height="20">Test</canvas>
            <img v-if="!hasThumb" class="thumbnail assetIcon" :src="require(`@/${defaultIcon}.svg`)" />
            <div v-if="isRenaming">
                <input ref="renameText" v-model="asset.name" type="text" />
            </div>
            <div v-else>{{asset.name}}</div>
        </div>
        <div class="rightFloat">
            <button class="rightButton" @click="deleteAsset">
                <img class="rightIcon" src="@/assets/trash.svg" />
            </button>
        </div>
    </div>
</template>

<script>
import Draw_2D from '@/common/Draw_2D';
import Util_2D from '@/common/Util_2D';

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
            
            if (selectedAsset){
                return this.$store.getters['AssetBrowser/getSelectedAsset'].ID == this.asset.ID;
            }

            return false;
        }
    },
    mounted(){
        document.addEventListener('click', this.clickOutside);
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
                this.isRenaming = true;
                setTimeout(()=>{
                    this.$refs.renameText.focus();
                    this.$refs.renameText.select();
                }, 10);
            }
            else{
                this.$emit('selectAsset', this.asset);
                this.dblClickCheck = true;
                setTimeout(()=>{this.dblClickCheck = false}, 200);
            }
        },
        clickOutside(event){
            let rootEl = this.$refs.asset;

            if (rootEl){
                let bounds = rootEl.getBoundingClientRect();

                if (
                    event.clientX > bounds.right ||
                    event.clientX < bounds.left ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom
                ){
                    this.isRenaming = false;
                }
            }
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
                ctx.save()
                ctx.scale(scaleFac, scaleFac);
                ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
                ctx.restore();
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
}

.selected{
    background: green;
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
}

.rightIcon{
    width: 20px;
    height: 20px;
}
</style>