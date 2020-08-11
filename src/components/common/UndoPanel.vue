<template>
    <div class="undoPanel">
        <UndoButton icon="assets/undo" :altText="$t('undo.undo')" :isActive="undoActive" @click="$emit('undo')"/>
        <UndoButton icon="assets/redo" :altText="$t('undo.redo')" :isActive="redoActive" @click="$emit('redo')"/>
    </div>
</template>

<script>
import UndoButton from '@/components/common/UndoButton';

export default {
    name: 'UndoPanel',
    props: ['undoLength', 'redoLength'],
    components: {
        UndoButton
    },
    data() {
        return {
            keyMap: {}
        }
    },
    computed: {
        undoActive(){
            return (this.undoLength > 0);
        },
        redoActive(){
            return (this.redoLength > 0);
        }
    },
    mounted() {
        document.addEventListener('keydown', this.registerKeys);
        document.addEventListener('keyup', this.unregisterKeys);
    },
    methods: {
        detectKeyCombo(event){
            console.log("keydown")
        },
        registerKeys(event){
            this.keyMap[event.key] = true;
            this.detectKeyCombo();
        },
        unregisterKeys(event){
            this.keyMap[event.key] = false;
            this.detectKeyCombo();
        },
        detectKeyCombo(){
            if (this.keyMap['Control'] && this.keyMap['z']){
                this.$emit('undo');
            }

            if (this.keyMap['Control'] && this.keyMap['Z']){
                this.$emit('redo');
            }
        }
    }
}
</script>

<style scoped>
    .undoPanel{
        display: flex;
        flex-direction: row;
    }
</style>