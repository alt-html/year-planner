import { Boot } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js';

/**
 * @alt-javascript/boot-vue — Vue 3 integration for @alt-javascript/boot.
 *
 * Bridges Boot CDI into Vue's reactive system via Vue's provide/inject pattern.
 * Works in both HTML-first (CDN/no-build) and CLI-first (Vite/webpack) modes.
 *
 * ## HTML-first (CDN / server-rendered pages)
 *
 *   <!-- directives live in the HTML — no JS template string -->
 *   <div id="app">
 *     <ul><li v-for="item in items" :key="item.id">{{ item.name }}</li></ul>
 *   </div>
 *
 *   <script type="module">
 *     import { createApp, ref } from 'vue';
 *     import { vueStarter } from '@alt-javascript/boot-vue';
 *     import { Context, Singleton } from '@alt-javascript/cdi';
 *     import { MyService } from './services.js';
 *
 *     await vueStarter({
 *       createApp,
 *       selector: '#app',
 *       contexts: [new Context([new Singleton(MyService)])],
 *       config: { app: { name: 'My App' } },   // plain POJO — Boot wraps it
 *       setup(appCtx) {
 *         const myService = appCtx.get('myService');
 *         const items = ref(myService.getAll());
 *         return { items };   // exposed to v-for, v-model etc. in the HTML
 *       },
 *     });
 *   </script>
 *
 * ## CLI-first (Vite / Vue CLI)
 *
 *   import { createApp } from 'vue';
 *   import { vueStarter } from '@alt-javascript/boot-vue';
 *   import App from './App.vue';
 *
 *   await vueStarter({
 *     createApp,
 *     rootComponent: App,        // SFC — setup() lives inside the component
 *     selector: '#app',
 *     contexts: [...],
 *     config: { ... },
 *   });
 *   // All CDI beans also injectable via inject('myService') inside SFCs
 */

/**
 * Boot CDI and mount a Vue app with all singletons provided via inject().
 *
 * Config may be a plain POJO — Boot.boot() wraps it in ValueResolvingConfig,
 * enabling profile overlays, ${placeholder} resolution, and config chaining.
 *
 * All CDI singletons are provided to the Vue app by name.
 *
 * @param {object}   options
 * @param {Function} options.createApp       — Vue.createApp function (required)
 * @param {Array}    options.contexts        — CDI Context instances (required)
 * @param {object}   [options.config]        — config POJO or config object
 * @param {object}   [options.rootComponent] — Vue root component (CLI mode)
 * @param {Function} [options.setup]         — (appCtx) => reactive state object
 *                                             (HTML-first mode; replaces rootComponent.setup)
 * @param {string}   [options.selector='#app'] — CSS selector to mount on
 * @returns {Promise<{ vueApp, applicationContext }>}
 */
async function vueStarter(options) {
  const {
    createApp,
    contexts,
    rootComponent,
    setup: setupFn,
    onReady,
    selector = '#app',
  } = options;

  if (!createApp) throw new Error('vueStarter: options.createApp is required.');
  if (!contexts)  throw new Error('vueStarter: options.contexts is required.');

  // Boot.boot() handles POJO → ValueResolvingConfig, logger setup, global
  // registry, banner, and CDI wiring — exactly as in server-side examples.
  const appCtx = await Boot.boot({ config: options.config, contexts, run: false });

  // Determine root component:
  //   CLI mode:   caller passes rootComponent (SFC) with its own setup()
  //   HTML-first: caller passes setup(appCtx) => reactive state; we build
  //               a minimal component that exposes it to the in-page directives
  let root = rootComponent;
  if (!root) {
    root = setupFn
      ? { setup: () => setupFn(appCtx) }
      : {};
  }

  const vueApp = createApp(root);

  // Provide all CDI singletons so any component can inject('myService') etc.
  _provideContext(vueApp, appCtx);

  if (onReady) {
    await onReady(vueApp, appCtx);
  }

  vueApp.mount(selector);

  return { vueApp, applicationContext: appCtx };
}

/** @deprecated Use vueStarter() */
async function createCdiApp(options) {
  return vueStarter(options);
}

/**
 * Vue plugin for CLI-first usage when you want to keep your own createApp() call.
 *
 *   const app = createApp(App);
 *   await app.use(vuePlugin, { contexts, config });
 *   app.mount('#app');
 *
 * Then in any component:
 *   const myService = inject('myService');
 */
const vuePlugin = {
  async install(app, options) {
    const appCtx = await Boot.boot({
      config: options.config,
      contexts: options.contexts,
      run: false,
    });
    _provideContext(app, appCtx);
  },
};

/** @deprecated Use vuePlugin */
const cdiPlugin = vuePlugin;

function _provideContext(app, appCtx) {
  app.provide('applicationContext', appCtx);
  app.provide('ctx', appCtx);
  for (const name of Object.keys(appCtx.components)) {
    const c = appCtx.components[name];
    if (c.instance) app.provide(name, c.instance);
  }
}

/**
 * Resolve a CDI bean by name. Utility for use outside Vue's inject system.
 */
function getBean(ctx, name) {
  return ctx.get(name);
}

export { cdiPlugin, createCdiApp, getBean, vuePlugin, vueStarter };
