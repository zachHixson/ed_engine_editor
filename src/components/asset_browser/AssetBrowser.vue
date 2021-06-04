<template>
    <div class="assetBrowser">
        <div ref="slideWrapper" class="slideWrapper">
            <div class="columns">
                <div class="categoryColumn">
                    <Category
                        v-for="category in categories"
                        :key="category.cat_ID"
                        :cat_ID="category.cat_ID"
                        :text="category.text"
                        :icon="category.icon"
                        @category-clicked="openCategory"/>
                </div>
                <div class="assetListColumn">
                    <div class="assetListHeading">
                        <div class="leftHeading">
                            <button class="btn" @click="back">
                                <inline-svg class="btn_icon" :src="require('@/assets/arrow_01.svg')"
                                    style="transform: rotate(-90deg);" :transformSource="removeStroke"/>
                            </button>
                            <inline-svg class="assetHeadingLogo" :src="require(`@/${selected_category.icon}.svg`)"
                                :transformSource="removeStroke"/>
                            {{selected_category.text}}
                        </div>
                        <div class="rightHeading">
                            <button class="addButton btn" @click="addAsset">
                                <inline-svg class="addButton_icon" :src="require('@/assets/plus.svg')" :transformSource="removeStroke"/>
                            </button>
                        </div>
                    </div>
                    <div ref="assetList" class="assetList">
                        <Asset
                            ref="assets"
                            v-for="asset in selectedList"
                            :key="asset.ID"
                            :asset="asset"
                            :defaultIcon="selected_category.icon"
                            @deleteAsset="deleteAsset"
                            @selectAsset="selectAsset"/>
                            <div v-if="selectedList.length <= 0">{{$t('asset_browser.no_assets')}}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {CATEGORY_ID} from '@/common/Enums';
import Category from './Category';
import Asset from './Asset';
import {removeStroke} from '@/common/Util.js';

export default {
    name: 'AssetBrowser',
    data(){
        return {
            selected_category: null,
            categories: [
                {
                    cat_ID: CATEGORY_ID.SPRITE,
                    text: this.$t("asset_browser.sprites"),
                    icon: 'assets/sprite_icon'
                },
                {
                    cat_ID: CATEGORY_ID.OBJECT,
                    text: this.$t("asset_browser.objects"),
                    icon: 'assets/object_icon'
                },
                {
                    cat_ID: CATEGORY_ID.ROOM,
                    text: this.$t("asset_browser.rooms"),
                    icon: 'assets/room_icon'
                }
            ]
        }
    },
    components: {
        Category,
        Asset
    },
    computed: {
        selectedList(){
            switch(this.selected_category.cat_ID){
                case CATEGORY_ID.SPRITE:
                    return this.$store.getters['GameData/getAllSprites'];
                case CATEGORY_ID.OBJECT:
                    return this.$store.getters['GameData/getAllObjects'];
                case CATEGORY_ID.ROOM:
                    return this.$store.getters['GameData/getAllRooms'];
            }

            return null;
        }
    },
    beforeMount(){
        this.selected_category = this.categories[0];
    },
    methods: {
        openCategory(category){
            this.selected_category = category;
            this.$refs.slideWrapper.classList.add('category_selected');
        },
        back(){
            this.$refs.slideWrapper.classList.remove('category_selected');
        },
        addAsset(){
            let assetList = this.$refs.assetList;

            this.$store.dispatch('GameData/addAsset', this.selected_category.cat_ID);

            this.$nextTick(()=>{
                if (assetList){
                    assetList.scrollTop = assetList.scrollHeight - assetList.clientHeight;
                }
            });
        },
        deleteAsset(asset){
            let selectedAsset = null;

            //determine which type of asset has been deleted
            if (asset.category_ID == CATEGORY_ID.ROOM){
                selectedAsset = this.$store.getters['AssetBrowser/getSelectedRoom'];
            }
            else{
                selectedAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];
            }

            //if the selected asset was deleted, shift the selection to the adjacent asset
            if (selectedAsset && asset.ID == selectedAsset.ID){
                this.selectAdjacent(asset);
            }

            //Actually delete the asset from Vuex
            this.$store.dispatch('GameData/deleteAsset', {category: asset.category_ID, id: asset.ID});
            this.$emit('asset-deleted');
        },
        selectAsset(asset, catId = null){
            if (asset && catId == null){
                catId = asset.category_ID;
            }

            if (catId == CATEGORY_ID.ROOM){
                this.$store.dispatch('AssetBrowser/selectRoom', asset);
            }
            else{
                this.$store.dispatch('AssetBrowser/selectAsset', asset);
            }

            this.$emit('asset-selected');
        },
        selectAdjacent(delAsset){
            let newSelection = null;

            for (let i = 0; i < this.selectedList.length; i++){
                if (this.selectedList[i].ID == delAsset.ID){
                    newSelection = (i > 0) ? this.selectedList[i - 1] : this.selectedList[i + 1]
                }
            }

            this.selectAsset(newSelection, delAsset.category_ID);
        },
        updateAsset(id = null){
            for (let i = 0; i < this.$refs.assets.length; i++){
                let curAsset = this.$refs.assets[i];

                if (id == null || curAsset.asset.ID == id){
                    curAsset.drawThumbnail();
                }
            }
        },
        removeStroke
    }
}
</script>

<style scoped>
*{
    --heading-font-size: 1.5em;
    --btn-arrow-width: 15px;
    --btn-arrow-height: 20px;
}

.assetBrowser{
    background: var(--main-bg);
    overflow: hidden;
    height: 100%;
    border-right: 1px solid black;
}

.slideWrapper{
    position: relative;
    right: 0%;
    width: 200%;
    height: 100%;
    transition: right 100ms;
    transition-timing-function: ease-out;
    padding-top: 10px;
}

.columns{
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
}

.categoryColumn{
    box-sizing: border-box;
    overflow: hidden;
    padding-left: 10px;
    width: 50%;
}

.assetListColumn{
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 100%;
    box-sizing: border-box;
}

.category_selected{
    right: 100%;
    transition: right 100ms;
    transition-timing-function: ease-out;
}

.assetListHeading{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 98%;
    height: 50px;
    background: var(--heading);
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    border-left: none;
    box-sizing: border-box;
    font-size: var(--heading-font-size);
    font-weight: bold;
    color: var(--text-dark);
}

.assetHeadingLogo{
    width: 30px;
    height: 30px;
    margin: 5px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.leftHeading{
    display: flex;
    align-items: center;
}

.rightHeading{
    display:flex;
    align-items: center;
}

.btn{
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--button-dark-norm);
    border: 2px solid var(--border);
    padding: 5px;
    margin: 5px;
    border-radius: var(--corner-radius);
}

.btn > .btn_icon{
    width: var(--btn-arrow-width);
    height: var(--btn-arrow-height);
    stroke: var(--text-dark);
}

.btn:hover{
    background: var(--button-dark-hover);
}

.btn:active{
    background: var(--button-dark-down);
}

.addButton{
    width: 30px;
    height: 30px;
}

.addButton > .addButton_icon{
    width: 100%;
    height: 100%;
    stroke: var(--text-dark);
    fill: var(--text-dark);
}

.assetList{
    position: relative;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
    padding: 10px;
}
</style>