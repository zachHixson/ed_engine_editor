<template>
    <div class="key-main">
        <button
            class="button"
            :class="active ? 'button-active':''"
            @click="setActive"
            @mousedown="$event.stopPropagation()"
            @keyup.space="deactivateSpace"
            v-click-outside="deactivate">
                <div v-if="!key && !active">No Key Set</div>
                <div v-if="active">Press any key</div>
                <div v-if="key && !active">{{keyDisplay}}</div>
        </button>
    </div>
</template>

<script>
export default {
    name: 'Key',
    props: ['widget', 'widgetData', 'setWidgetData'],
    data(){
        return {
            active: false,
            key: null,
            code: null,
        }
    },
    computed: {
        keyDisplay(){
            if (this.code == 'Space'){
                return this.code;
            }

            return this.key.length > 1 ? this.key : this.key.toUpperCase();
        }
    },
    beforeMount(){
        if (!this.widgetData){
            this.setWidgetData({code: null, key: null});
        }
    },
    mounted(){
        if (this.widgetData){
            this.key = this.widgetData.key;
            this.code = this.widgetData.code;
        }
    },
    methods: {
        setActive(){
            this.active = true;
            document.addEventListener('keydown', this.onKey);
        },
        onKey(event){
            event.preventDefault();
            this.deactivate();
            this.setWidgetData({
                code: event.code,
                key: event.key,
            });
            this.key = event.key;
            this.code = event.code;
        },
        deactivate(){
            this.active = false;
            document.removeEventListener('keydown', this.onKey);
        },
        deactivateSpace(event){
            event.preventDefault();
        },
    }
}
</script>

<style scoped>
.key-main{
    padding: 5px;
    width: 100%;
}

.button{
    width: 100%;
    height: 2em;
    background: #DDDDDD;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.button:hover{
    background: var(--button-dark-hover);
}

.button-active,
.button-active:hover{
    border-color: var(--button-norm);
}
</style>