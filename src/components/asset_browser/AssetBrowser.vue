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
                            <button class="btn" @click="back">&lt;</button>
                            <img class="assetHeadingLogo" :src="require(`@/${selected_category.icon}.svg`)" />
                            {{selected_category.text}}
                        </div>
                        <div class="rightHeading">
                            <button class="addButton btn" @click="addAsset">+</button>
                        </div>
                    </div>
                    <div v-if="selectedList.length > 0" ref="assetList" class="assetList">
                        <Asset
                            ref="assets"
                            v-for="asset in selectedList"
                            :key="asset.ID"
                            :asset="asset"
                            :defaultIcon="selected_category.icon"
                            @deleteAsset="deleteAsset"
                            @selectAsset="selectAsset"/>
                    </div>
                    <div v-else>No Assets in list</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {CATEGORY_ID} from '@/common/Enums';
import Category from './Category';
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
        back(event){
            this.$refs.slideWrapper.classList.remove('category_selected');
        },
        addAsset(event){
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
        }
    }
}
</script>

<style scoped>
.assetBrowser{
    background: #FFFF99;
    overflow: hidden;
    height: 100%;
}

.title{
    position: relative;
    top: -4px;
}

.slideWrapper{
    position: relative;
    right: 0%;
    width: 200%;
    height: 100%;
    transition: right 100ms;
    transition-timing-function: ease-out;
}

.columns{
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
}

.categoryColumn{
    width: 50%;
}

.assetListColumn{
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 100%;
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
    width: 100%;
    height: 50px;
    background: #AAAAFF;;
}

.assetHeadingLogo{
    width: 30px;
    height: 30px;
    margin: 5px;
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
    background: none;
    border: 1px solid black;
    padding: 5px;
    margin: 5px;
}

.btn:hover{
    background: #5555FF;
}

.btn:active{
    background: #2222FF;
}

.addButton{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
}

.assetList{
    position: relative;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
}
</style>