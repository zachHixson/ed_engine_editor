import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import './assets/main.css';
import i18n from './i18n.js';
import './directives.ts';
// import {loadShared} from '@compiled/Shared';
// import {loadEngine} from '@compiled/Engine';

const app = createApp(App).use(i18n)

app.use(createPinia())

app.mount('#app')
