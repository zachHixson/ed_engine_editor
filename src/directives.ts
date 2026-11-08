import { type DirectiveBinding } from 'vue';
import { useMainStore } from './stores/Main';
import { TooltipEventBus } from './components/common/Tooltip.vue';

//Run code when clicking outside of an element
type VClickOutSideEl = HTMLElement & {
    checkOutside: (event: Event) => void;
};
export const vClickOutside = {
    mounted: function (el: VClickOutSideEl, binding: DirectiveBinding) {
        el.checkOutside = (event: Event) => {
            if (!(el == event.target || el.contains(event.target as HTMLElement))) {
                const instance = binding.instance as DirectiveBinding['instance'];
                instance && binding.value(event);
            }
        };

        if (binding.modifiers.lazy){
            setTimeout(()=>{
                document.body.addEventListener('click', el.checkOutside);
            }, 80);
        }
        else{
            document.body.addEventListener('click', el.checkOutside);
        }

        if (binding.modifiers.any){
            document.body.addEventListener('mousedown', el.checkOutside);
        }
    },
    unmounted: function (el: VClickOutSideEl) {
        document.body.removeEventListener('click', el.checkOutside);
        document.body.removeEventListener('mousedown', el.checkOutside);
    }
};

//Allows hotkey code to detect when the user is typing in an input
type VInputActiveEl = HTMLElement & {
    onFocus: () => void;
    onBlur: () => void;
    stopProp: (event: Event) => void;
};
export const vInputActive = {
    beforeMount: function(el: VInputActiveEl){
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

    unmounted: function(el: VInputActiveEl){
        el.removeEventListener('focus', el.onFocus);
        el.removeEventListener('blur', el.onBlur);
        el.removeEventListener('mousedown', el.stopProp);
        el.removeEventListener('click', el.stopProp);
        el.removeEventListener('mousemove', el.stopProp);
    },
};

//Popup global tooltip above components
type VTooltipEl = HTMLElement & {
    tooltipText: string;
    mouseOverHandler: (e: MouseEvent) => void;
    mouseOutHandler: () => void;
    mouseDownHandler: () => void;
};
export const vTooltip = {
    beforeMount: function(el: VTooltipEl, binding: DirectiveBinding){
        const isGetter = typeof binding.value == 'function';

        el.tooltipText = isGetter ? binding.value() : binding.value;
        el.mouseOverHandler = function(e: MouseEvent){
            e.preventDefault();
            e.stopPropagation();

            TooltipEventBus.onActivateTooltip.emit({
                el: (el as unknown as HTMLDivElement),
                text: el.tooltipText,
            });
        };
        el.mouseOutHandler = function(){
            TooltipEventBus.onHideTooltip.emit();
        };
        el.mouseDownHandler = function(){
            TooltipEventBus.onMouseDown.emit();
        };

        el.addEventListener('mouseover', el.mouseOverHandler);
        el.addEventListener('mouseout', el.mouseOutHandler);
        el.addEventListener('mousedown', el.mouseDownHandler);
    },

    updated: function(el: VTooltipEl, binding: DirectiveBinding){
        el.tooltipText = binding.value;
    },

    unmounted: function(el: VTooltipEl){
        el.removeEventListener('mouseover', el.mouseOverHandler);
        el.removeEventListener('mouseout', el.mouseOutHandler);
        el.removeEventListener('mousedown', el.mouseDownHandler);
    }
};
