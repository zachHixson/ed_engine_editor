import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import * as Directive from './directives';

export const app = createApp(App);

app.use(createPinia());
app.directive('click-outside', Directive.vClickOutside);
app.directive('input-active', Directive.vInputActive);
app.directive('tooltip', Directive.vTooltip);

app.mount('#app');
