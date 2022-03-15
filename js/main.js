import { context } from './context.js';
import { i18n } from './i18n.js';
// import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

window.request = superagent;
window.context = context;



i18n.locale = context.model.lang;

let app = Vue.createApp({
    data() {
        return context.model;
    },
    methods: context.methods,
    mounted() {
        this.refresh();
    }
});

app.use(i18n);
app.mount('#app');
context.app = app;

document.title = app.$t('label.yearplanner');
document.documentElement.lang = context.model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













