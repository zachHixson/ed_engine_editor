import Vue from 'vue';
import store from './store'
import { getTooltipComponent, showTooltip, hideTooltip } from './components/common/Tooltip.vue';

//Run code when clicking outside of an element
Vue.directive('click-outside', {
    bind: function (el, binding, vnode) {
        el.checkOutside = (event) => {
            if (!(el == event.target || el.contains(event.target))) {
                vnode.context[binding.expression](event);
            }
        };

        document.body.addEventListener('click', el.checkOutside);
    },
    unbind: function (el) {
        document.body.removeEventListener('click', el.checkOutside)
    }
});

//Allows hotkey code to detect when the user is typing in an input
Vue.directive('input-active', {
    bind: function(el){
        el.onFocus = ()=>{
            store.dispatch('setInputActive', true);
        };
        el.onBlur = ()=>{
            store.dispatch('setInputActive', false);
        };
        el.stopProp = (event)=>{event.stopPropagation()};

        el.addEventListener('focus', el.onFocus);
        el.addEventListener('blur', el.onBlur);
        el.addEventListener('mousedown', el.stopProp);
        el.addEventListener('click', el.stopProp);
        el.addEventListener('mousemove', el.stopProp);
    },

    unbind: function(el){
        el.removeEventListener('focus', el.onFocus);
        el.removeEventListener('blur', el.onBlur);
        el.removeEventListener('mousedown', el.stopProp);
        el.removeEventListener('click', el.stopProp);
        el.removeEventListener('mousemove', el.stopProp);
    },
});

//Popup global tooltip above components
Vue.directive('tooltip', {
    inserted: function(el, binding){
        const ttComponent = getTooltipComponent();

        el.mouseOverHandler = function(){
            const timeLimit = ttComponent.HOVER_TIME * 1000;
            ttComponent.text = binding.value;

            if (!ttComponent.text.length){
                return;
            }

            ttComponent.timeout = setTimeout(()=>{
                showTooltip(el);
            }, timeLimit);
        };
        el.mouseOutHandler = function(){
            hideTooltip();
        };

        el.addEventListener('mouseover', el.mouseOverHandler);
        el.addEventListener('mouseout', el.mouseOutHandler);
    },

    unbind: function(el){
        el.removeEventListener('mouseover', el.mouseOverHandler);
        el.removeEventListener('mouseout', el.mouseOutHandler);
    }
})