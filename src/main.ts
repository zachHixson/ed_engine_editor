import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import i18n from './i18n.js';
import * as Directive from './directives';
// import {loadShared} from '@compiled/Shared';
// import {loadEngine} from '@compiled/Engine';

export const app = createApp(App).use(i18n)

app.use(createPinia())
app.directive('click-outside', Directive.vClickOutside);
app.directive('input-active', Directive.vInputActive);
app.directive('tooltip', Directive.vTooltip);

app.mount('#app')
