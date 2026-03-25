import { BrowserProfileResolver, ProfileAwareConfig, ConfigFactory, EphemeralConfig } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js';
import { LoggerCategoryCache, LoggerFactory, ConfigurableLogger } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js';
import { getGlobalRef, getGlobalRoot } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js';
import { ApplicationContext } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js';

/* eslint-disable import/extensions */
/**
 * Boot-browser.js — browser-facing Boot implementation.
 *
 * Mirrors Boot.js but targets browser ESM bundles.
 * Config source: explicit options.config (POJO or config object) → window.config.
 * CDI: delegated to @alt-javascript/cdi ApplicationContext (loaded dynamically).
 *
 * Profile resolution is automatic: if the config POJO contains a
 * `profiles.urls` map, BrowserProfileResolver resolves the active profile
 * from window.location and wraps the POJO in a ProfileAwareConfig — no
 * boilerplate needed in application code:
 *
 *   await vueStarter({
 *     config: {
 *       app: { env: 'default' },
 *       profiles: {
 *         urls: { 'localhost:5173': 'dev', '127.0.0.1:5173': 'local' },
 *         dev:   { app: { env: 'development' } },
 *         local: { app: { env: 'local' } },
 *       },
 *     },
 *     ...
 *   });
 */

class Boot {
  /**
   * Detect and resolve config from: explicit options.config → window.config.
   *
   * Wrapping rules (applied in order):
   *   1. Already has has()/get() → pass through unchanged.
   *   2. Plain POJO with profiles.urls → BrowserProfileResolver resolves
   *      active profiles from window.location, wrapped in ProfileAwareConfig.
   *      ProfileAwareConfig satisfies the has()/get() duck-type, so it is
   *      then wrapped by ConfigFactory.getConfig() for placeholder resolution.
   *   3. Plain POJO without profiles.urls → ConfigFactory.getConfig(EphemeralConfig).
   */
  static detectConfig(options) {
    const configArg = options && options.config;
    let $config = null;

    if (typeof window !== 'undefined' && window?.config) {
      $config = window.config;
    }

    $config = configArg || $config;

    if (!$config) {
      throw new Error('Unable to detect config. Pass config: { ... } to Boot.boot().');
    }

    // Already a config object — pass through.
    if (typeof $config.has === 'function' && typeof $config.get === 'function') {
      return $config;
    }

    // Plain POJO — check for URL→profile mapping and auto-resolve.
    if ($config.profiles && $config.profiles.urls) {
      const activeProfiles = BrowserProfileResolver.resolve({
        urlMappings: $config.profiles.urls,
      });
      // ProfileAwareConfig satisfies has()/get() — return directly.
      // Placeholder resolution (${...}) is not applied to profile-aware configs
      // in browser builds; use explicit values in profile sections instead.
      return new ProfileAwareConfig($config, activeProfiles);
    }

    return ConfigFactory.getConfig(new EphemeralConfig($config));
  }

  /**
   * Bootstrap the application for browser environments.
   *
   * Accepts identical options to the Node Boot.js:
   *   { config, contexts, run, loggerFactory, loggerCategoryCache, fetch }
   *
   * config may be a plain POJO — wrapped automatically.
   * Profile resolution from URL is automatic when profiles.urls is present.
   * run defaults to true; pass run: false to skip the CDI run phase.
   *
   * @param {object} [options]
   * @returns {Promise<import('@alt-javascript/cdi').ApplicationContext|undefined>}
   */
  static async boot(options) {
    const loggerFactoryArg       = options && options.loggerFactory;
    const loggerCategoryCacheArg = options && options.loggerCategoryCache;
    const fetchArg               = options && options.fetch;

    // Normalise run: undefined/null → true; string 'false' → false
    let runPhase = true;
    if (options && options.run !== undefined && options.run !== null) {
      runPhase = (typeof options.run === 'string')
        ? options.run.toLowerCase() !== 'false'
        : Boolean(options.run);
    }

    const $config = Boot.detectConfig(options);

    const $loggerCategoryCache = loggerCategoryCacheArg
      || (typeof window !== 'undefined' && window?.loggerCategoryCache)
      || new LoggerCategoryCache();

    const $loggerFactory = loggerFactoryArg
      || new LoggerFactory($config, $loggerCategoryCache, ConfigurableLogger.DEFAULT_CONFIG_PATH);

    let $fetch = fetchArg;
    if (typeof fetch !== 'undefined') $fetch = $fetch || fetch; // eslint-disable-line no-undef

    const $globalref = getGlobalRef();
    $globalref.boot = { contexts: { root: { config: $config } } };
    $globalref.boot.contexts.root.loggerCategoryCache = $loggerCategoryCache;
    $globalref.boot.contexts.root.loggerFactory       = $loggerFactory;
    $globalref.boot.contexts.root.fetch               = $fetch;

    if (options && options.contexts) {
      const { ApplicationContext, Context, Singleton } = await import('https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js');
      const rootContext = new Context([
        new Singleton({ Reference: $config,              name: 'config' }),
        new Singleton({ Reference: $loggerFactory,       name: 'loggerFactory' }),
        new Singleton({ Reference: $loggerCategoryCache, name: 'loggerCategoryCache' }),
      ]);
      const appCtx = new ApplicationContext({
        contexts: [rootContext, ...options.contexts],
        config: $config,
      });
      await appCtx.start({ run: runPhase });
      return appCtx;
    }

    return undefined;
  }

  static root(name, defaultValue) {
    const value = getGlobalRoot(name);
    return value || defaultValue;
  }

  /** Browser stub — Boot.test() is only used in Node test suites */
  static test() {
    throw new Error('Boot.test() is not available in browser builds.');
  }
}

/* eslint-disable import/extensions */

class Application {
  static async run(optionsArg) {
    const options = optionsArg;
    if (!Boot.root('config')) {
      Boot.boot(options);
    }

    options.config = options?.config || Boot.root('config');
    let applicationContext = options?.applicationContext || options;
    if (applicationContext.constructor.name !== 'ApplicationContext') {
      applicationContext = new ApplicationContext(options);
    }
    applicationContext.lifeCycle();
    return applicationContext;
  }
}

/* eslint-disable import/extensions */

const { boot } = Boot;
const { root } = Boot;
const { test } = Boot;

export { Application, Boot, boot, root, test };
