<template>
    <div class="logoMenu">
        <button class="fileMenu" @click="(event)=>{event.stopPropagation(); fileVisible = !fileVisible}">
            ED
            <div ref="dropDown" class="dropDown" v-show="fileVisible">
                <button
                    v-for="choice in choices"
                    :key="choice.id"
                    @click="choice.method()"
                    class="choice">{{choice.text}}</button>
            </div>
        </button>
        <div class="projNameBox">
            {{$t('editor_main.project_name')}}
            <div ref="displayEditBox" class="displayEditBox">
                <div v-show="!isRenaming" ref="projNameDisplay" class="projNameDisplay">{{projName}}</div>
                <input v-show="isRenaming" ref="projNameEdit" type="text" class="projNameEdit" v-model="projName" />
                <button class="renameBtn" @click="rename"><img class="renameBtnImg" src="@/assets/rename.svg" /></button>
            </div>
        </div>
        <input type="file" ref="fileOpen" style="display: none" @change="loadProjectFile"/>
    </div>
</template>

<script>
import {saveAs} from 'file-saver';

let enumID = 0;

export default {
    name: 'Logomenu',
    data() {
        return {
            fileVisible: false,
            isRenaming: false,
            choices: [
                {
                    id: enumID++,
                    text: this.$t('file_menu.new'),
                    method: () => {console.log("New")}
                },
                {
                    id: enumID++,
                    text: this.$t('file_menu.open'),
                    method: this.open
                },
                {
                    id: enumID++,
                    text: this.$t('file_menu.save'),
                    method: this.save
                },
                {
                    id: enumID++,
                    text: this.$t('file_menu.export'),
                    method: () => {console.log("Export Game")}
                },
                {
                    id: enumID++,
                    text: this.$t('file_menu.prefs'),
                    method: () => {console.log("Preferences")}
                },
                {
                    id: enumID++,
                    text: this.$t('file_menu.about'),
                    method: () => {console.log("About")}
                }
            ]
        }
    },
    computed: {
        projName: {
            get: function(){
                return this.$store.getters['GameData/getProjectName'];
            },
            set: function(newName){
                this.$store.dispatch('GameData/setProjectName', newName);
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.clickOutside);
        document.addEventListener('keypress', (event) => {
            if (this.isRenaming && event.key == 'Enter'){
                this.isRenaming = false;
            }
        });
    },
    methods: {
        clickOutside(event){
            let dropDown = this.$refs.dropDown;
            let editBox = this.$refs.displayEditBox;

            if (dropDown){
                this.fileVisible = !this.checkInBounds(event, dropDown);
            }

            if (editBox && this.isRenaming){
                this.isRenaming = !this.checkInBounds(event, editBox);
            }
        },
        checkInBounds(event, obj){
            let bounds = obj.getBoundingClientRect();

            if (
                event.clientX > bounds.right ||
                event.clientX < bounds.left ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
            ){
                return true;
            }

            return false;
        },
        rename(){
            this.isRenaming = !this.isRenaming;

            if (this.isRenaming){
                this.$nextTick(()=>{
                    this.$refs.projNameEdit.focus();
                    this.$refs.projNameEdit.select();
                }, 10);
            }
        },
        save(){
            let blob = new Blob([this.$store.getters['GameData/getSaveData']]);
            saveAs(blob, "MyFile.edproj");
        },
        open(event){
            this.$refs.fileOpen.click();
        },
        loadProjectFile(){
            let input = event.target;

            if ('files' in input && input.files.length > 0){
                let reader = new FileReader();
                reader.onload = () => {
                    this.$store.dispatch('GameData/loadSaveData', reader.result);
                }
                reader.readAsText(input.files[0]);
            }
        }
    }
}
</script>

<style scoped>
.logoMenu{
    display: flex;
    flex-direction: row;
    background: #FF9999;
}

.fileMenu{
    position: relative;
    flex-shrink: 0;
    width: 70px;
    height: 70px;
    background: none;
    border: 1px solid black;
    font-size: 2em;
}

.dropDown{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: white;
    top: 20px;
    left: 100%;
    z-index: 1000;
}

.choice{
    display: flex;
    justify-content: start;
    background: none;
    border: none;
    border-bottom: 1px solid black;
    width: 10vw;
    text-align: left;
    padding: 10px;
}

.choice:hover{
    background: #DDDDFF;
}

.choice:last-child{
    border: none;
}

.projNameBox{
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 10px;
}

.displayEditBox{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.projNameEdit{
    max-width: 9em;
}

.renameBtn{
    display: flex;
    justify-content: center;
    align-items: center;
    background: none;
    border: none;
    z-index: 1000;
}

.renameBtnImg{
    width: 30px;
    height: 30px;
}
</style>