<template>
    <div class="DialogNewVariable">
        <div class="dialog">
            <div class="heading">
                New Variable:
            </div>
            <div class="controlsWrapper">
                <div class="control">
                    <label for="name">Name: </label>
                    <input id="name" type="text" v-model="varName" autocomplete="off"/>
                    <Decorator v-show="error" ref="error" style="width: 25px" :src="require(`@/assets/error_decorator.svg`)" />
                    <Decorator v-show="warning" ref="warning" style="width: 25px" :src="require(`@/assets/warning_decorator.svg`)" />
                </div>
                <div class="control">
                    <label for="type">Type: </label>
                    <select style="background: white">
                        <option>Test</option>
                    </select>
                </div>
                <div class="control">
                    <label for="isGlobal">Make Global: </label>
                    <input id="isGlobal" type="checkbox" v-model="isGlobal" />
                </div>
                <div class="control">
                    <label for="isList">Is List: </label>
                    <input id="isList" type="checkbox" />
                </div>
            </div>
            <div class="buttonWrapper">
                <button class="button">Cancel</button>
                <button class="button" :disabled="!isValid">Create</button>
            </div>
        </div>
    </div>
</template>

<script>
import Decorator from '@/components/common/Decorator';

export default {
    name: 'DialogNewVariable',
    props: ['selectedAsset', 'callback'],
    components: {
        Decorator,
    },
    data(){
        return {
            varName: '',
            isGlobal: false,
        }
    },
    mounted(){
        this.selectedAsset.localVariables.set('m', true);
    },
    computed: {
        globalVariableMap(){
            return this.$store.getters['LogicEditor/getGlobalVariableMap'];
        },
        error(){
            const varMap = this.isGlobal ? this.globalVariableMap : this.selectedAsset.localVariables;
            const isError = !!varMap.get(this.varName.toLowerCase());

            isError && this.$refs.error.setTooltipText("Error, variable already exists please try again and a whole bunch of text");

            return isError;
        },
        warning(){
            return false && !this.error;
        },
        isValid(){
            return !this.error && !!this.varName.length;
        },
    }
}
</script>

<style scoped>
@import '../common/formStyles.css';

.DialogNewVariable{
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--modal-bg);
    z-index: 9999;
}

.dialog{
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    background: white;
    min-width: max-content;
    min-height: max-content;
    width: 300px;
    padding: 5px;
    box-sizing: border-box;
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
}

.heading{
    width: 100%;
    color: var(--heading);
    font-size: 2em;
    margin-bottom: 10px;
}

.controlsWrapper{
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    gap: 5px;
}

.control{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
}

.buttonWrapper{
    display: flex;
    flex-direction: row;
    align-self: flex-end;
    margin-top: 10px;
    gap: 5px;
}

.button{
    background: var(--button-norm);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    font-size: medium;
    padding: 5px;
}

.button:hover{
    background: var(--button-hover);
}

.button:active{
    background: var(--button-down);
}

.button:disabled{
    background: var(--button-disabled);
}
</style>