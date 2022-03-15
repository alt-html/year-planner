import { context } from './context.js';
import { urlParam } from './urlparam.js';
import { i18n } from './i18n.js';

window.request = superagent;




i18n.locale = context.model.lang;

let app = new Vue({
    i18n : i18n,
    el: '#app',
    data: context.model,
    methods: context.methods,
    mounted() {
        // this.refresh();
    }
})

app.refresh();

document.title = app.$t('label.yearplanner');
document.documentElement.lang = context.model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













