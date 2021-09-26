import Vue from 'vue'
import App from './App.vue'
import store from './store'
import i18n from './i18n'

window.IS_EDITOR = true;
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

new Vue({
    store,
    i18n,
    render: h => h(App)
}).$mount('#app')