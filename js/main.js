import config from './config/config.js';
import { context } from './config/context.js';
import contexts  from './config/contexts.js';
import { ApplicationContext } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi/dist/alt-javascript-cdi-esm.js';

import { app } from './vue/app.js';

let applicationContext = new ApplicationContext({contexts, config});
applicationContext.start();
context.applicationContext = applicationContext;

window.request = superagent;
window.context = context;

app.use(context.i18n);
app.mount('#app');

document.title = context.i18n.global.t('label.yearplanner');
document.documentElement.lang = context.model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













