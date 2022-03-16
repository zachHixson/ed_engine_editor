import Vue from 'vue'
import App from './App.vue'
import store from './store'
import i18n from './i18n'
import {loadShared} from '@compiled/shared';
import {loadEngine} from '@compiled/engine';

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
})

new Vue({
    store,
    i18n,
    render: h => h(App),
    beforeCreate: function(){
        const sharedScript = document.createElement('script');
        const engineScript = document.createElement('script');
        sharedScript.id = 'shared';
        engineScript.id = 'engine';
        sharedScript.innerHTML = loadShared();
        engineScript.innerHTML = loadEngine();
        document.body.append(sharedScript);
        document.body.append(engineScript);
    }
}).$mount('#app');