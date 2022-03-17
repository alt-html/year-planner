import { app } from './vue/app.js';
import { context } from './config/context.js';

window.request = superagent;
window.context = context;

app.use(context.i18n);
app.mount('#app');

document.title = context.i18n.global.t('label.yearplanner');
document.documentElement.lang = context.model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













