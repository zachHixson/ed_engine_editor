<template>
    <div class="undoPanel">
        <UndoButton icon="assets/undo" :altText="$t('undo.undo')" :isActive="undoActive" @click="$emit('undo')"/>
        <UndoButton icon="assets/redo" :altText="$t('undo.redo')" :isActive="redoActive" @click="$emit('redo')"/>
    </div>
</template>

<script>
import UndoButton from '@/components/common/UndoButton';
import HotkeyMap from '@/components/common/HotkeyMap'

export default {
    name: 'UndoPanel',
    props: ['undoLength', 'redoLength'],
    components: {
        UndoButton
    },
    data(){
        return {
            hotkeyMap: new HotkeyMap(),
            keyDown: null,
            keyUp: null
        }
    },
    computed:{
        undoActive(){
            return (this.undoLength > 0);
        },
        redoActive(){
            return (this.redoLength > 0);
        }
    },
    mounted(){
        this.keyDown = this.hotkeyMap.keyDown.bind(this.hotkeyMap);
        this.keyUp = this.hotkeyMap.keyUp.bind(this.hotkeyMap);

        document.addEventListener('keydown', this.keyDown);
        document.addEventListener('keyup', this.keyUp);

        this.hotkeyMap.enabled = true;
        this.hotkeyMap.bindKey(['control', 'z'], this.$emit.bind(this), ['undo']);
        this.hotkeyMap.bindKey(['control', 'shift', 'z'], this.$emit.bind(this), ['redo']);
    },
    beforeDestroy(){
        document.removeEventListener('keydown', this.keyDown);
        document.removeEventListener('keyup', this.keyUp);
    }
}
</script>

<style scoped>
    .undoPanel{
        display: flex;
        flex-direction: row;
    }
</style>