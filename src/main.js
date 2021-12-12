import Vue from 'vue'
import App from './App.vue'
import store from './store'
import i18n from './i18n'

window.EDITOR = {};
Vue.config.productionTip = false;

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

Vue.directive('input-active', {
    bind: function(el){
        const onFocus = ()=>{
            window.EDITOR.textFocused = true
            document.dispatchEvent(new Event('input-focus-changed'));
        };
        const onBlur = ()=>{
            window.EDITOR.textFocused = false;
            document.dispatchEvent(new Event('input-focus-changed'));
        };
        const stopProp = (event)=>{event.stopPropagation()};

        el.addEventListener('focus', onFocus);
        el.addEventListener('blur', onBlur);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('click', stopProp);
        el.addEventListener('mousemove', stopProp);
    },

    unbind: function(el){
        el.removeEventListener('focus', onFocus);
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('mousedown', stopProp);
        el.removeEventListener('click', stopProp);
        el.removeEventListener('mousemove', stopProp);
    },
})

new Vue({
    store,
    i18n,
    render: h => h(App)
}).$mount('#app')