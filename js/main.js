import { vueStarter } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/boot-vue@3/dist/alt-javascript-boot-vue-esm.js';
import config from './config/config.js';
import contexts from './config/contexts.js';
import { app } from './vue/app.js';

const { vueApp, applicationContext } = await vueStarter({
    createApp: Vue.createApp,
    selector: '#app',
    contexts: [contexts],
    config,
    rootComponent: app,
    onReady: async (vueApp, appCtx) => {
        await appCtx.get('application').run(vueApp);
    },
});

document.body.dataset.appReady = '1';
window.applicationContext = applicationContext;
