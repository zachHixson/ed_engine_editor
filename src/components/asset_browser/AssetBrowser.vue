<template>
    <div class="assetBrowser">
        <div ref="slideWrapper" class="slideWrapper">
            <div class="columns">
                <div class="categoryColumn">
                    <div class="category"
                        v-for="category in categories"
                        :key="category.cat_ID">
                        <div class="cat_title">
                            <img class="cat_icon" :src="require(`@/${category.icon}.svg`)"/>
                            {{category.text}}
                        </div>
                        <button class="btn" @click="openCategory(category)">
                            <img class="btn_icon" src="@/assets/arrow_01.svg" style="transform: rotate(90deg);"/>
                        </button>
                    </div>
                </div>
                <div class="assetListColumn">
                    <div class="assetListHeading">
                        <div class="leftHeading">
                            <button class="btn" @click="back">
                                <img class="btn_icon" src="@/assets/arrow_01.svg" style="transform: rotate(-90deg);"/>
                            </button>
                            <img class="assetHeadingLogo" :src="require(`@/${selected_category.icon}.svg`)"/>
                            {{selected_category.text}}
                        </div>
                        <div class="rightHeading">
                            <button class="addButton btn" @click="addAsset">
                                <img class="addButton_icon" src="@/assets/plus.svg"/>
                            </button>
                        </div>
                    </div>
                    <div ref="assetList" class="assetList">
                        <Asset
                            ref="assets"
                            v-for="asset in selectedList"
                            :key="asset.id"
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
import Asset from './Asset';

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
                    cat_ID: CATEGORY_ID.LOGIC,
                    text: this.$t("asset_browser.logic"),
                    icon: 'assets/logic'
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
        Asset
    },
    computed: {
        selectedList(){
            switch(this.selected_category.cat_ID){
                case CATEGORY_ID.SPRITE:
                    return this.$store.getters['GameData/getAllSprites'];
                case CATEGORY_ID.OBJECT:
                    return this.$store.getters['GameData/getAllObjects'];
                case CATEGORY_ID.LOGIC:
                    return this.$store.getters['GameData/getAllLogic'];
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
            if (selectedAsset && asset.id == selectedAsset.id){
                this.selectAdjacent(asset);
            }

            //Actually delete the asset from Vuex
            this.$store.dispatch('GameData/deleteAsset', {category: asset.category_ID, id: asset.id});
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
                if (this.selectedList[i].id == delAsset.id){
                    newSelection = (i > 0) ? this.selectedList[i - 1] : this.selectedList[i + 1]
                }
            }

            this.selectAsset(newSelection, delAsset.category_ID);
        },
        updateAsset(id = null){
            for (let i = 0; i < this.$refs.assets.length; i++){
                let curAsset = this.$refs.assets[i];

                if (id == null || curAsset.asset.id == id){
                    curAsset.drawThumbnail();
                }
            }
        }
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
    overflow: hidden;
    height: 100%;
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

.category{
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 50px;
    background: var(--heading);
    border: 2px solid var(--border);
    border-right: none;
    padding-left: 5px;
    margin-bottom: 3px;
    box-sizing: border-box;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.cat_title{
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: var(--heading-font-size);
    color: var(--text-dark);
}

.cat_icon{
    width: 30px;
    height: 30px;
    margin: 5px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
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
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
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