import Vue from 'vue';
import App from './App.vue';
import store from './store';
import i18n from './i18n';
import './directives.js';
import {loadShared} from '@compiled/Shared';
import {loadEngine} from '@compiled/Engine';

window.EDITOR = {};
Vue.config.productionTip = false;

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