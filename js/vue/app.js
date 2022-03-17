import { context } from './config/context.js';
import { i18n } from './i18n/i18n.js';

window.request = superagent;
window.context = context;

i18n.global.locale = context.model.lang;

let app = Vue.createApp({
    data() {
        return context.model;
    },
    methods: context.controller,
    mounted() {
        this.refresh();
    }
});

app.use(i18n);
app.mount('#app');
context.app = app;
context.i18n = i18n;

document.title = i18n.global.t('label.yearplanner');
document.documentElement.lang = context.model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













