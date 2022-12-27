import type { DirectiveBinding, VNode } from 'vue';
import { useMainStore } from './stores/Main';
import { getTooltipComponent, showTooltip, hideTooltip } from './components/common/Tooltip.vue';

type ExpandedEl = HTMLElement & {[key: string | number | symbol]: any};

//Run code when clicking outside of an element
export const vClickOutside = {
    beforeMount: function (el: ExpandedEl, binding: DirectiveBinding, vnode: VNode) {
        el.checkOutside = (event: Event) => {
            if (!(el == event.target || el.contains(event.target as HTMLElement))) {
                const instance = binding.instance as any;
                instance && binding.value(event);
            }
        };

        document.body.addEventListener('click', el.checkOutside);
    },
    unmounted: function (el: ExpandedEl) {
        document.body.removeEventListener('click', el.checkOutside)
    }
};

//Allows hotkey code to detect when the user is typing in an input
export const vInputActive = {
    beforeMount: function(el: ExpandedEl){
        const mainStore = useMainStore();

        el.onFocus = ()=>{
            mainStore.setInputActive(true);
        };
        el.onBlur = ()=>{
            mainStore.setInputActive(false);
        };
        el.stopProp = (event: Event)=>{event.stopPropagation()};

        el.addEventListener('focus', el.onFocus);
        el.addEventListener('blur', el.onBlur);
        el.addEventListener('mousedown', el.stopProp);
        el.addEventListener('click', el.stopProp);
        el.addEventListener('mousemove', el.stopProp);
    },

    unmounted: function(el: ExpandedEl){
        el.removeEventListener('focus', el.onFocus);
        el.removeEventListener('blur', el.onBlur);
        el.removeEventListener('mousedown', el.stopProp);
        el.removeEventListener('click', el.stopProp);
        el.removeEventListener('mousemove', el.stopProp);
    },
};

//Popup global tooltip above components
export const vTooltip = {
    beforeMount: function(el: ExpandedEl, binding: DirectiveBinding){
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

    unmounted: function(el: ExpandedEl){
        el.removeEventListener('mouseover', el.mouseOverHandler);
        el.removeEventListener('mouseout', el.mouseOutHandler);
    }
};