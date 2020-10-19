<template>
    <div class="logoMenu">
        <button class="fileMenu" @click="(event)=>{event.stopPropagation(); visible = !visible}">
            ED
            <div ref="dropDown" class="dropDown" v-show="visible">
                <button
                    v-for="choice in choices"
                    :key="choice.id"
                    @click="choice.method()"
                    class="choice">{{choice.text}}</button>
            </div>
        </button>
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
            visible: false,
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
    mounted() {
        document.addEventListener('click', this.clickOutside);
    },
    methods: {
        clickOutside(event){
            let dropDown = this.$refs.dropDown;

            if (dropDown){
                let bounds = dropDown.getBoundingClientRect();

                if (
                    event.clientX > bounds.right ||
                    event.clientX < bounds.left ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom
                ){
                    this.visible = false;
                }
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
    background: #FF9999;
}

.fileMenu{
    position: relative;
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
</style>