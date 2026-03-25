import { isPlainObject, getGlobalRoot } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js';

/**
 * Lightweight config backed by a plain JavaScript object.
 * Supports dot-notation paths (e.g. 'a.b.c') and falsy values (0, false, '').
 * Used as the default config in tests and as the storage layer for PropertySourceChain.
 */
class EphemeralConfig {
  constructor(object, path) {
    const self = this;
    this.object = object;
    this.path = path;
    if (this.object) {
      Object.assign(self, this.object);
    }
  }

  get(path, defaultValue) {
    if (!(typeof this.object?.[path] === 'undefined')) {
      return this.object?.[path];
    }
    const pathSteps = path?.split('.') || [];
    let root = this.object;
    for (let i = 0; i < pathSteps.length && root !== null && root !== undefined; i++) {
      root = root?.[pathSteps[i]];
    }
    if (root !== null && root !== undefined) {
      return root;
    }
    if ((typeof defaultValue !== 'undefined')) {
      return defaultValue;
    }
    throw new Error(`Config path ${path} returned no value.`);
  }

  has(path) {
    if (!(typeof this.object?.[path] === 'undefined')) {
      return true;
    }
    const pathSteps = path?.split('.') || [];
    let root = this.object;
    for (let i = 0; i < pathSteps.length && root !== null && root !== undefined; i++) {
      root = root?.[pathSteps[i]];
    }
    return root !== null && root !== undefined;
  }
}

/* eslint-disable import/extensions */

/**
 * Config wrapper that delegates to an underlying config source.
 * Transparently wraps plain objects in EphemeralConfig.
 * Base class for ValueResolvingConfig.
 */
class DelegatingConfig {
  constructor(config, path) {
    if (isPlainObject(config)) {
      this.config = new EphemeralConfig(config);
    } else {
      this.config = config;
    }
    const originalConfig = this.config;
    Object.assign(this, config);
    this.config = originalConfig;
    this.path = path;
  }

  has(path) {
    return this.config.has(path);
  }
}

/** Base resolver — walks object trees applying value transformations. */
class Resolver {
  static isObject(value) {
    const type = typeof value;
    return value != null && (type === 'object' || type === 'function');
  }

  mapValuesDeep(values, callback) {
    if (Resolver.isObject(values)) {
      return Object.fromEntries(
        Object.entries(values).map(([
          key, value]) => [key, this.mapValuesDeep(value, callback)]),
      );
    }
    return callback(values);
  }

  async asyncMapValuesDeep(values, callback) {
    if (Resolver.isObject(values)) {
      return Object.fromEntries(
        Object.entries(values).map(
          async ([key, value]) => [key, this.mapValuesDeep(value, callback)],
        ),
      );
    }
    return callback(values);
  }
}

/* eslint-disable import/extensions */

/** Chains multiple resolvers, applying each in sequence to the config tree. */
class DelegatingResolver extends Resolver {
  constructor(resolvers) {
    super();
    this.resolvers = resolvers;
  }

  resolve(config) {
    let resolvedConfig = config;
    for (let i = 0; i < this.resolvers.length; i++) {
      resolvedConfig = this.resolvers[i].resolve(resolvedConfig);
    }
    return resolvedConfig;
  }
}

/* eslint-disable import/extensions */

/** Resolver that only processes values matching a Selector pattern. */
class SelectiveResolver extends Resolver {
  constructor(selector) {
    super();
    this.selector = selector;
  }
}

/** Base selector interface — determines whether a value should be processed by a resolver. */
class Selector {
}

/* eslint-disable import/extensions */

/** Selects values containing ${...} placeholder syntax for resolution. */
class PlaceHolderSelector extends Selector {
  // eslint-disable-next-line class-methods-use-this
  matches(value) {
    return typeof value === 'string'
            && value.includes('${')
            && value.includes('}')
            && value.indexOf('${') < value.indexOf('}');
  }
}

/* eslint-disable import/extensions */

class PlaceHolderResolver extends SelectiveResolver {
  constructor(selector, reference) {
    super(selector || (new PlaceHolderSelector()));
    this.reference = reference;
  }

  resolve(config) {
    const self = this;
    const resolvedConfig = Resolver.prototype.mapValuesDeep(config, (v) => {
      if (self.selector.matches(v)) {
        try {
          let resolvedValue = '';
          let remainder = v;
          let placeholder;

          while (resolvedValue === '' || (remainder.includes('${')
                                && remainder.includes('}')
                                && remainder.indexOf('${') < remainder.indexOf('}'))
          ) {
            resolvedValue = `${resolvedValue}${remainder.substring(0, remainder.indexOf('${'))}`;
            placeholder = remainder.substring(remainder.indexOf('${') + 2, remainder.indexOf('}'));
            resolvedValue = `${resolvedValue}${self.reference.get(placeholder)}`;
            remainder = remainder.substring(remainder.indexOf('}') + 1);
          }
          resolvedValue = `${resolvedValue}${remainder}`;
          return resolvedValue;
        } catch (e) {
          return v;
        }
      }
      return v;
    });
    return resolvedConfig;
  }
}

/* eslint-disable import/extensions */

/** Selects values starting with a given prefix (e.g. 'enc.', 'url.'). */
class PrefixSelector extends Selector {
  constructor(prefix) {
    super();
    this.prefix = prefix;
  }

  matches(value) {
    return typeof value === 'string' && value.startsWith(this.prefix);
  }

  resolveValue(value) {
    return value.replaceAll(this.prefix, '');
  }

  async asyncResolveValue(value) {
    return this.resolveValue(value);
  }
}

/* eslint-disable import/extensions */

class URLResolver extends SelectiveResolver {
  constructor(selector, fetchArg) {
    super(selector || (new PrefixSelector('url.')));
    this.$fetch = fetchArg;
  }

  resolve(config) {
    const self = this;
    const resolvedConfig = Resolver.prototype.mapValuesDeep(config, (v) => {
      if (self.selector.matches(v)) {
        try {
          return v;
        } catch (e) {
          return v;
        }
      }
      return v;
    });
    return resolvedConfig;
  }

  async asyncResolve(config, parentConfig, path) {
    const self = this;
    const resolvedConfig = await Resolver.prototype.asyncMapValuesDeep(config, async (v) => {
      if (self.selector.matches(v)) {
        try {
          const selectedValue = self.selector.resolveValue(v);
          const urlPath = path.substring(0, path.lastIndexOf('.'));
          const method = parentConfig.has(`${urlPath}.method`) ? parentConfig.get(`${urlPath}.method`) : null;
          const authorization = parentConfig.has(`${urlPath}.authorization`) ? parentConfig.get(`${urlPath}.authorization`) : null;
          const body = parentConfig.has(`${urlPath}.body`) ? parentConfig.get(`${urlPath}.body`) : null;
          const headers = parentConfig.has(`${urlPath}.headers`) ? parentConfig.get(`${urlPath}.headers`) : null;
          const fetchedValue = await this.fetch(
            selectedValue, authorization, method, body, headers,
          );
          return fetchedValue;
        } catch (e) {
          return v;
        }
      }
      return v;
    });
    return resolvedConfig;
  }

  async fetch(url, authorization, method, body, headers) {
    if (!this.$fetch) {
      throw new Error('fetch is required');
    }
    const $headers = authorization ? { authorization } : {};
    Object.assign($headers, headers);
    const opts = { method: method || 'get', headers: $headers };
    if (method && method?.toLowerCase() !== 'get' && method?.toLowerCase() !== 'head') {
      Object.assign(opts, JSON.stringify(body || {}));
    }
    return this.$fetch(url, opts).then((res) => res.json());
  }
}

/* eslint-disable import/extensions */

/**
 * Config that resolves placeholders, encrypted values, and URL fetches.
 * Wraps a delegate config (typically node-config or EphemeralConfig) with
 * a chain of resolvers (PlaceHolderResolver, JasyptDecryptor, URLResolver).
 *
 * Placeholder syntax: ${path:defaultValue}
 */
class ValueResolvingConfig extends DelegatingConfig {
  constructor(config, resolver, path, async) {
    super(config, path);
    const self = this;
    this.resolver = resolver;
    if (this.config && !async) {
      this.resolved_config = resolver.resolve(this.path == null ? config : this.config.get(path));
      Object.assign(self, this.resolved_config);
    }

    ValueResolvingConfig.prototype.has = DelegatingConfig.prototype.has;
  }

  get(path, defaultValue) {
    if ((typeof defaultValue !== 'undefined') && this.has(path) === false) {
      return defaultValue;
    }
    return new ValueResolvingConfig(this.config, this.resolver, path).resolved_config;
  }

  async fetch(path, defaultValue) {
    const self = this;
    if (defaultValue && this.has(path) === false) {
      return defaultValue;
    }
    const asyncConfig = new ValueResolvingConfig(this.config, this.resolver, path, true);
    return asyncConfig.resolver.asyncResolve(
      asyncConfig.path == null ? asyncConfig : asyncConfig.config.get(asyncConfig.path),
      self, path,
    );
  }
}

/**
 * ProfileAwareConfig — config wrapper that overlays profile-specific sections.
 *
 * Given a config object with top-level profile sections:
 *
 *   {
 *     api: { url: 'http://prod.example.com' },
 *     logging: { level: { '/': 'warn' } },
 *     profiles: {
 *       urls: { 'localhost:8080': 'dev' },
 *       dev: {
 *         api: { url: 'http://localhost:8081' },
 *         logging: { level: { '/': 'debug' } },
 *       },
 *       staging: {
 *         api: { url: 'http://staging.example.com' },
 *       },
 *     },
 *   }
 *
 * When the active profile is 'dev', `config.get('api.url')` returns
 * 'http://localhost:8081'. When no profile matches, defaults apply.
 *
 * This replaces WindowLocationSelectiveConfig's URL-key approach with
 * a clean profile-based overlay, symmetric with server-side profiles.
 */

class ProfileAwareConfig {
  /**
   * @param {object} configObject — raw config with optional `profiles` section
   * @param {string[]} activeProfiles — resolved profile names
   */
  constructor(configObject, activeProfiles = ['default']) {
    this._raw = configObject;
    this._activeProfiles = activeProfiles;
    this._profileConfigs = [];
    this._baseConfig = new EphemeralConfig(this._stripProfiles(configObject));

    // Build profile overlay chain (later profiles override earlier)
    const profileDefs = configObject.profiles || {};
    for (const profile of activeProfiles) {
      if (profileDefs[profile]) {
        this._profileConfigs.push(new EphemeralConfig(profileDefs[profile]));
      }
    }
  }

  /** @returns {string[]} active profile names */
  get activeProfiles() {
    return [...this._activeProfiles];
  }

  /**
   * Check if a config path exists.
   * Checks profile overlays first (in order), then base config.
   */
  has(path) {
    for (const pc of this._profileConfigs) {
      if (pc.has(path)) return true;
    }
    return this._baseConfig.has(path);
  }

  /**
   * Get a config value.
   * Profile overlays take precedence over base config.
   */
  get(path, defaultValue) {
    for (const pc of this._profileConfigs) {
      if (pc.has(path)) return pc.get(path);
    }
    return this._baseConfig.get(path, defaultValue);
  }

  /**
   * Strip the `profiles` section from the config object to produce
   * the base config without profile definitions or URL mappings.
   */
  _stripProfiles(obj) {
    if (!obj || !obj.profiles) return obj;
    const copy = { ...obj };
    delete copy.profiles;
    return copy;
  }
}

/**
 * BrowserProfileResolver — resolves active profiles from the browser URL.
 *
 * Replaces the v2 WindowLocationSelectiveConfig approach (URL-as-config-key
 * with dot→+ encoding) with a declarative URL-to-profile mapping:
 *
 *   profiles: {
 *     urls: {
 *       'localhost:8080': 'dev',
 *       'localhost:3000': 'dev',
 *       'staging.example.com': 'staging',
 *       '*.example.com': 'prod',
 *     }
 *   }
 *
 * Matching rules:
 *   1. Exact match on host:port (port included only if non-standard)
 *   2. Exact match on hostname
 *   3. Wildcard match (*.example.com matches app.example.com)
 *   4. Query parameter ?profile=dev overrides URL mapping
 *   5. Falls back to 'default' if no match
 *
 * This makes browser profile resolution symmetric with server-side
 * NODE_ACTIVE_PROFILES — the same conditionalOnProfile('dev') works
 * in both environments.
 */
class BrowserProfileResolver {
  /**
   * Resolve active profiles from URL and config.
   *
   * @param {object} [options]
   * @param {object} [options.urlMappings] — URL-to-profile map
   * @param {string} [options.locationHref] — full URL (default: window.location.href)
   * @param {string} [options.queryParam] — query param name (default: 'profile')
   * @returns {string[]} active profile names
   */
  static resolve(options = {}) {
    const urlMappings = options.urlMappings || {};
    const queryParam = options.queryParam || 'profile';

    let url;
    try {
      const href = options.locationHref
        || (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
      url = new URL(href);
    } catch {
      return ['default'];
    }

    // 1. Query parameter override: ?profile=dev or ?profile=dev,staging
    const queryProfile = url.searchParams.get(queryParam);
    if (queryProfile) {
      return queryProfile.split(',').map((p) => p.trim()).filter(Boolean);
    }

    // 2. URL mapping
    const hostPort = url.port && url.port !== '80' && url.port !== '443'
      ? `${url.hostname}:${url.port}`
      : url.hostname;

    // Try exact host:port match
    if (urlMappings[hostPort]) {
      return BrowserProfileResolver._toArray(urlMappings[hostPort]);
    }

    // Try hostname-only match (without port)
    if (url.port && urlMappings[url.hostname]) {
      return BrowserProfileResolver._toArray(urlMappings[url.hostname]);
    }

    // Try wildcard match (*.example.com)
    for (const pattern of Object.keys(urlMappings)) {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1); // .example.com
        if (url.hostname.endsWith(suffix) && url.hostname !== suffix.slice(1)) {
          return BrowserProfileResolver._toArray(urlMappings[pattern]);
        }
      }
    }

    // 3. Default
    return ['default'];
  }

  /**
   * Normalise a profile value to an array.
   * Supports: 'dev', 'dev,staging', ['dev', 'staging']
   */
  static _toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((p) => p.trim()).filter(Boolean);
    }
    return ['default'];
  }
}

/* eslint-disable import/extensions */

/** Browser config adapter that resolves window.location-based config paths. */
class WindowLocationSelectiveConfig extends DelegatingConfig {
  // eslint-disable-next-line class-methods-use-this
  has(path) {
    const location = `${window.location.origin}${window.location.pathname}`.replaceAll('.', '+');

    return this.config.has(`${location}.${path}`)
        || this.config.has(path);
  }

  get(path, defaultValue) {
    const location = `${window.location.origin}${window.location.pathname}`.replaceAll('.', '+');
    if ((typeof defaultValue !== 'undefined') && this.has(path) === false) {
      return defaultValue;
    }
    if (this.config.has(`${location}.${path}`)) {
      return this.config.get(`${location}.${path}`);
    }
    return this.config.get(path);
  }
}

/* eslint-disable import/extensions */

class ConfigFactory {
  static detectFetch(fetchArg) {
    let $fetch = null;
    if (!(typeof fetch === 'undefined')) {
      // eslint-disable-next-line no-undef
      $fetch = fetch;
    }
    if (getGlobalRoot('fetch')) {
      $fetch = getGlobalRoot('fetch');
    }
    $fetch = fetchArg || $fetch;
    return $fetch;
  }

  static getConfig(config, resolver, fetchArg) {
    const placeHolderResolver = new PlaceHolderResolver(new PlaceHolderSelector());
    const urlResolver = new URLResolver(new PrefixSelector('url.'), ConfigFactory.detectFetch(fetchArg));
    const delegatingResolver = new DelegatingResolver(
      [placeHolderResolver, urlResolver],
    );
    const valueResolvingConfig = new ValueResolvingConfig(config,
      resolver || delegatingResolver);

    placeHolderResolver.reference = valueResolvingConfig;
    const windowLocationConfig = new WindowLocationSelectiveConfig(valueResolvingConfig);
    return windowLocationConfig;
  }
}

/* eslint-disable import/extensions */
const config = new EphemeralConfig({});

export { BrowserProfileResolver, ConfigFactory, DelegatingConfig, DelegatingResolver, EphemeralConfig, PlaceHolderResolver, PlaceHolderSelector, PrefixSelector, ProfileAwareConfig, Resolver, SelectiveResolver, Selector, URLResolver, ValueResolvingConfig, config };
