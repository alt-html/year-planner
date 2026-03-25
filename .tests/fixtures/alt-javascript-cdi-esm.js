import { LoggerFactory } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js';
import { EphemeralConfig } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js';

/* eslint-disable import/extensions */

/**
 * A named collection of component definitions.
 * Passed to ApplicationContext to define the beans in the context.
 *
 * @example
 * const ctx = new Context([new Singleton(MyService), new Singleton(MyRepo)]);
 */
class Context {
    constructor(components,profile) {
        this.components = (components || []) ;
        this.components = (Array.isArray(this.components) ? this.components : [this.components]) ;
        this.profile = profile;
    }
}

/**
 * Base component definition. Wraps a class reference or factory with metadata
 * (name, scope, properties, lifecycle hooks, AOP config).
 *
 * Usually created via convenience subclasses: Singleton, Prototype, Service, Transient.
 *
 * @example
 * new Component({ Reference: MyClass, name: 'myClass', scope: 'singleton' })
 */
class Component {
    constructor(options) {
        this.Reference = options?.Reference || (options.factory || options.wireFactory ? null : options );
        this.name = options?.name;
        this.qualifier = options?.qualifier;
        this.scope = options?.scope;
        this.properties = options?.properties;
        this.profiles = options?.profiles;
        this.primary = options?.primary;
        this.factory = options?.factory;
        this.factoryFunction = options?.factoryFunction;
        this.factoryArgs = options?.factoryArgs;
        this.wireFactory = options?.wireFactory;
        this.isActive = true;
        this.instance = null;

        this.isClass = false;
        this.require = null;
    }
}

/** Property definition — binds a config value to a component property via placeholder resolution. */
const Property = class Property {
  constructor(options) {
    this.name = options?.name;
    this.reference = options?.ref || options?.reference;
    this.value = options?.value;
    this.defaultValue = options?.defaultValue;
  }
};

/** Available component scopes. */
class Scopes {
    static SINGLETON = 'singleton';
    static SERVICE = 'singleton';
    static PROTOTYPE = 'prototype';
    static TRANSIENT = 'prototype';
}

/* eslint-disable import/extensions */

/** Prototype-scoped component — new instance on each get() call. */
class Prototype extends Component {
  constructor(optionsArg) {
    const options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : { Reference: optionsArg };
    options.scope = Scopes.PROTOTYPE;
    super(options);
  }
}

/* eslint-disable import/extensions */

/** Singleton-scoped component — one shared instance per ApplicationContext. */
class Singleton extends Component {
    constructor(optionsArg) {
        let options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : {Reference: optionsArg};
        options.scope = Scopes.SINGLETON;
        super (options);
    }
}

/* eslint-disable import/extensions */

/** Service component — singleton-scoped, semantic alias for application services. */
class Service extends Component {
    constructor(optionsArg) {
        let options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : {Reference: optionsArg};
        options.scope = Scopes.SINGLETON;
        super (options);
    }
}

/* eslint-disable import/extensions */

/** Transient-scoped component — alias for prototype scope. */
class Transient extends Component {
    constructor(optionsArg) {
        let options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : {Reference: optionsArg};
        options.scope = Scopes.PROTOTYPE;
        super (options);
    }
}

/**
 * BeanPostProcessor — hook into the ApplicationContext bean lifecycle.
 *
 * Implement postProcessBeforeInitialization and/or postProcessAfterInitialization
 * to intercept bean creation. Register as a context component like any other bean.
 *
 * ApplicationContext detects BeanPostProcessor instances automatically and calls
 * them for every singleton during the lifecycle.
 *
 * The default implementations return the instance unchanged.
 */
class BeanPostProcessor {
  /**
   * Called after dependency injection but before init() for each singleton.
   *
   * @param {Object} instance — the bean instance
   * @param {string} name — the bean name in the context
   * @returns {Object} the (possibly modified or replaced) bean instance
   */
  postProcessBeforeInitialization(instance, name) {
    return instance;
  }

  /**
   * Called after init() for each singleton.
   *
   * @param {Object} instance — the bean instance
   * @param {string} name — the bean name in the context
   * @returns {Object} the (possibly modified or replaced) bean instance
   */
  postProcessAfterInitialization(instance, name) {
    return instance;
  }
}

/**
 * Isomorphic application event publisher.
 *
 * No dependency on Node's EventEmitter — works in browser ESM.
 * Subscribe by event type (class constructor or string name).
 * Publish events to all matching subscribers.
 */
class ApplicationEventPublisher {
  constructor() {
    /** @type {Map<string, Array<Function>>} event type name → listener functions */
    this.listeners = new Map();
    /** Wildcard listeners that receive all events */
    this.wildcardListeners = [];
  }

  /**
   * Subscribe to an event type.
   *
   * @param {Function|string} eventType — event class constructor or string type name, or '*' for all
   * @param {Function} listener — callback(event)
   * @returns {Function} unsubscribe function
   */
  on(eventType, listener) {
    if (typeof listener !== 'function') {
      throw new Error('ApplicationEventPublisher.on: listener must be a function');
    }

    if (eventType === '*' || eventType === 'all') {
      this.wildcardListeners.push(listener);
      return () => {
        const idx = this.wildcardListeners.indexOf(listener);
        if (idx >= 0) this.wildcardListeners.splice(idx, 1);
      };
    }

    const typeName = typeof eventType === 'string' ? eventType : eventType.name;

    if (!this.listeners.has(typeName)) {
      this.listeners.set(typeName, []);
    }
    this.listeners.get(typeName).push(listener);

    return () => {
      const arr = this.listeners.get(typeName);
      if (arr) {
        const idx = arr.indexOf(listener);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }

  /**
   * Publish an event to all matching listeners.
   *
   * @param {ApplicationEvent|Object} event — must have constructor.name or type property
   */
  publish(event) {
    const typeName = event?.constructor?.name !== 'Object'
      ? event.constructor.name
      : event.type;

    // Type-specific listeners
    if (typeName && this.listeners.has(typeName)) {
      for (const listener of this.listeners.get(typeName)) {
        listener(event);
      }
    }

    // String type property (if different from class name)
    if (event.type && event.type !== typeName && this.listeners.has(event.type)) {
      for (const listener of this.listeners.get(event.type)) {
        listener(event);
      }
    }

    // Wildcard listeners
    for (const listener of this.wildcardListeners) {
      listener(event);
    }
  }

  /** Remove all listeners. */
  clear() {
    this.listeners.clear();
    this.wildcardListeners = [];
  }

  /** @returns {number} total registered listeners including wildcards */
  get listenerCount() {
    let count = this.wildcardListeners.length;
    for (const arr of this.listeners.values()) {
      count += arr.length;
    }
    return count;
  }
}

/**
 * Base class for application events.
 *
 * All application events carry a source (the object that published the event)
 * and a timestamp. Subclass for specific event types.
 */
class ApplicationEvent {
  constructor(source) {
    this.source = source;
    this.timestamp = new Date();
  }
}

/** Published when the ApplicationContext has been fully initialized. */
class ContextRefreshedEvent extends ApplicationEvent {
  constructor(source) {
    super(source);
    this.type = 'ContextRefreshedEvent';
  }
}

/** Published when the ApplicationContext is being closed/destroyed. */
class ContextClosedEvent extends ApplicationEvent {
  constructor(source) {
    super(source);
    this.type = 'ContextClosedEvent';
  }
}

/* eslint-disable import/extensions */

// ---------------------------------------------------------------------------
// Lodash-free helpers (replaced lodash dependency with native equivalents)
// ---------------------------------------------------------------------------

/** Lowercase the first character of a string. Equivalent to _.lowerFirst(). */
function lowerFirst(str) {
  if (!str) return str;
  return str[0].toLowerCase() + str.slice(1);
}

/** Return elements in a that are also in b. Equivalent to _.intersection(). */
function intersection(a, b) {
  return a.filter((x) => b.includes(x));
}

// ---------------------------------------------------------------------------

/**
 * Spring-inspired IoC application context for JavaScript.
 *
 * Manages the lifecycle of components (singletons and prototypes):
 * parsing context definitions, creating instances, autowiring dependencies,
 * running bean post-processors, publishing lifecycle events, and registering
 * shutdown destroyers.
 *
 * Lifecycle phases (in order):
 * 1. parseContexts — resolve context definitions from config and explicit contexts
 * 2. registerEventPublisher — create the ApplicationEventPublisher singleton
 * 3. createSingletons — instantiate all singleton components (with constructor arg resolution)
 * 4. injectSingletonDependencies — autowire property-based and explicit dependencies
 * 5. detectBeanPostProcessors — find BeanPostProcessor instances
 * 6. postProcessBeforeInitialization — run pre-init hooks
 * 7. detectEventListeners — find components with onApplicationEvent method
 * 8. initialiseSingletons — call setApplicationContext() then init(), respecting dependsOn order
 * 9. postProcessAfterInitialization — run post-init hooks
 * 10. registerSingletonDestroyers — register stop() and destroy() for shutdown
 * 11. publishContextRefreshedEvent — notify listeners context is ready
 *
 * @example
 * const context = new Context([new Singleton(MyService)]);
 * const appCtx = new ApplicationContext({ contexts: [context], config });
 * await appCtx.start();
 * const svc = appCtx.get('myService');
 */
class ApplicationContext {
  // eslint-disable-next-line
  static DEFAULT_CONTEXT_NAME = 'default';

  static DEFAULT_CONFIG_CONTEXT_PATH = 'context';

  /**
   * Create a new ApplicationContext.
   *
   * @param {object|Array<Context>} options - context array or options object
   * @param {Array<Context>} [options.contexts] - component context definitions
   * @param {string[]} [options.profiles] - active profiles for conditional component activation
   * @param {string} [options.name='default'] - context name for logging
   * @param {string} [options.configContextPath='context'] - config key containing context definitions
   * @param {object} [options.config] - config object with has()/get() interface
   */
  constructor(options) {
    const contexts = options?.contexts || options;
    if (Array.isArray(contexts)) {
      this.contexts = contexts;
    } else {
      this.contexts = (contexts ? [contexts] : []);
    }
    this.components = {};
    this.profiles = options?.profiles
        || (typeof (process) !== 'undefined' && process?.env?.NODE_ACTIVE_PROFILES)
        || undefined;
    this.name = options?.name || ApplicationContext.DEFAULT_CONTEXT_NAME;
    this.configContextPath = options?.configContextPath
        || (typeof (process) !== 'undefined' && process?.env?.NODE_CONFIG_CONTEXT_PATH)
        || ApplicationContext.DEFAULT_CONFIG_CONTEXT_PATH;
    this.config = options?.config || new EphemeralConfig({});
    if (options?.config) {
      // eslint-disable-next-line no-param-reassign
      delete options.config;
    }
    if (options?.profiles) {
      // eslint-disable-next-line no-param-reassign
      delete options.profiles;
    }
    if (options?.configContextPath) {
      // eslint-disable-next-line no-param-reassign
      delete options.configContextPath;
    }
    this.logger = LoggerFactory.getLogger('@alt-javascript/cdi/ApplicationContext', this.config);
  }

  /**
   * Start the application context — runs the full lifecycle (prepare + run).
   *
   * @param {object} [options]
   * @param {boolean} [options.run=true] - if false, skips the run phase (no start()/run() calls on components)
   */
  async start(options) {
    this.logger.verbose('Application context starting.');
    await this.lifeCycle(options);
    this.logger.verbose('Application context started.');
  }

  /**
   * Execute the full lifecycle: prepare phase then run phase.
   * @param {object} [options] - passed through to run()
   */
  async lifeCycle(options) {
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle started.`);
    await this.prepare();
    return this.run(options);
  }

  /**
   * Prepare phase: parse contexts, create singletons, wire dependencies,
   * run post-processors, initialise, and publish ContextRefreshedEvent.
   */
  async prepare() {
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle prepare phase started.`);
    await this.parseContexts();
    this.registerEventPublisher();
    this.createSingletons();
    this.injectSingletonDependencies();
    this.detectBeanPostProcessors();
    this.postProcessBeforeInitialization();
    this.detectEventListeners();
    this.initialiseSingletons();
    this.postProcessAfterInitialization();
    this.registerSingletonDestroyers();
    this.publishContextRefreshedEvent();
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle prepare phase completed.`);
  }


  /** Detect and load context component definitions from the config object. */
  detectConfigContext() {
    this.logger.verbose('Detecting config contexts started.');
    if (this.config) {
      if (this.config.has(this.configContextPath)) {
        this.logger.verbose(`Detected config context at ${this.configContextPath}, adding context.`);
        this.contexts.push(this.config.get(this.configContextPath));
      }
    }
    this.logger.verbose('Detecting config contexts completed.');
  }

  /** Parse all context definitions: config-driven, explicit, and global framework components. */
  async parseContexts() {
    this.logger.verbose('Parsing configured contexts started.');
    this.detectConfigContext();
    for (let i = 0; i < this.contexts.length; i++) {
      if (this.contexts[i]) {
        if (this.contexts[i]?.constructor?.name === 'Context') {
          // eslint-disable-next-line no-await-in-loop
          await this.parseContextComponents(this.contexts[i]);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await this.parseContextComponents(new Context(this.contexts[i]));
        }
      } else {
        const msg = `ApplicationContext (${this.name}) received a nullish context.`;
        this.logger.error(msg);
        throw new Error(msg);
      }
    }
    // Register default infrastructure components so beans with `this.logger = null`,
    // `this.config = null`, etc. are always autowired — even when no explicit
    // loggerFactory or config is in the provided contexts.
    // When Boot.boot() provides these via the root context, those take precedence
    // (they're parsed first, registration is first-write wins).
    if (!this.components.loggerFactory) {
      await this.deriveContextComponent({
        Reference: LoggerFactory,
        name: 'loggerFactory',
      });
    }
    if (!this.components.logger) {
      await this.deriveContextComponent({
        scope: Scopes.PROTOTYPE,
        wireFactory: 'loggerFactory',
        factoryFunction: 'getLogger',
        name: 'logger',
      });
    }
    if (!this.components.config) {
      await this.deriveContextComponent({
        Reference: this.config,
        name: 'config',
      });
    }
    this.logger.verbose('Parsing configured contexts completed.');
  }

  async deriveContextComponent(contextComponent) {
    if (contextComponent.name || contextComponent.Reference || contextComponent.factory) {
      await this.parseContextComponent(contextComponent);
    } else {
      const contextKeys = Object.keys(contextComponent);
      for (let i = 0; i < contextKeys.length; i++) {
        const name = contextKeys[i];
        const component = contextComponent[name];
        component.name = name;
        // eslint-disable-next-line no-await-in-loop
        await this.parseContextComponent(component);
      }
    }
  }

  async parseContextComponents(context) {
    this.logger.verbose('Processing context components started');
    if (context.components) {
      if (Array.isArray(context.components)) {
        for (let i = 0; i < context.components.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.deriveContextComponent(context.components[i]);
        }
      }
    }
    this.logger.verbose('Processing context components completed');
  }

  /**
   * Parse a single component definition into the internal registry.
   * Handles: profiles, conditions, primary resolution, scope detection, constructorArgs, dependsOn.
   * @param {object} componentArg - raw component definition
   */
  async parseContextComponent(componentArg) {
    let component = componentArg;
    if (component?.constructor?.name !== 'Component'
        && component?.constructor?.name !== 'Singleton'
        && component?.constructor?.name !== 'Prototype') {
      component = new Component(
        component, component.name,
        component.qualifier,
        component.scope,
        component.properties, component.profiles,
      );
      component.require = componentArg.require;
    }
    const constructr = component?.Reference?.prototype?.constructor;
    const $component = {};
    $component.isClass = constructr !== undefined;

    $component.name = lowerFirst(component.name) || lowerFirst(constructr.name);
    $component.qualifier = component.qualifier || lowerFirst(constructr?.qualifier);
    $component.scope = component.scope || lowerFirst(constructr?.scope) || Scopes.SINGLETON;
    $component.Reference = component.Reference;
    $component.factory = component.factory;
    $component.factoryFunction = component.factoryFunction;
    $component.factoryArgs = component.factoryArgs;
    $component.wireFactory = component.wireFactory;
    $component.constructorArgs = componentArg.constructorArgs || component.constructorArgs;
    $component.dependsOn = componentArg.dependsOn || component.dependsOn;
    $component.primary = componentArg.primary || component.primary || false;
    // TODO - dynamic import (async)
    if (component.require) {
      try {
      // eslint-disable-next-line
        let module = await import(/* @vite-ignore */ component.require);
        $component.Reference = module.default;
        $component.isClass = ($component?.Reference?.prototype?.constructor !== undefined);
      } catch (err) {
        this.logger.error(err);
      }
    }

    $component.properties = component.properties || constructr?.properties;
    $component.profiles = component.profiles || constructr?.profiles;
    if (!$component.profiles) {
      $component.profiles = [];
    }
    if (typeof $component.profiles === 'string') {
      $component.profiles = $component.profiles.split(',');
    }
    $component.isActive = $component.profiles.length === 0;

    const activeProfiles = this.profiles?.split(',') || [];
    if (activeProfiles.length > 0 && !$component.isActive) {
      $component.isActive = intersection(activeProfiles, $component.profiles).length > 0;
      if ($component.isActive === false) {
        let negations = $component.profiles.filter((profile) => profile.startsWith('!'));
        negations = negations.map((profile) => profile.substring(1));
        $component.isActive = negations.length > 0
            && intersection(activeProfiles, negations).length === 0;
      }
    }

    if ($component.isActive) {
      // Evaluate condition if present (from componentArg, e.g. conditionalOnProperty)
      const condition = componentArg.condition;
      if (condition && typeof condition === 'function') {
        const activeProfiles = this.profiles?.split(',') || [];
        const conditionResult = condition(this.config, this.components, activeProfiles);
        if (!conditionResult) {
          this.logger.verbose(`Condition failed for component (${$component.name}), skipping registration`);
          return;
        }
        this.logger.verbose(`Condition passed for component (${$component.name})`);
      }

      if (!this.components[$component.name]) {
        this.components[$component.name] = $component;
        this.logger.verbose(`Added application context component (${$component.name}) with ${$component.scope} scope`);
      } else if ($component.primary && !this.components[$component.name].primary) {
        this.logger.verbose(`Primary component (${$component.name}) replacing existing non-primary`);
        this.components[$component.name] = $component;
      } else if (!$component.primary && this.components[$component.name].primary) {
        this.logger.verbose(`Skipping non-primary duplicate (${$component.name}), primary already registered`);
      } else {
        const msg = `Duplicate definition of application context component (${$component.name})`;
        this.logger.error(msg);
        throw new Error(msg);
      }
    } else {
      this.logger.verbose(`Skipped inactive application context component (${$component.name}), with scope ${$component.scope}`);
    }
  }

  /**
   * Create all singleton instances. Resolves constructor args from the context,
   * with circular dependency detection via a creation stack.
   */
  createSingletons() {
    this.logger.verbose('Creating singletons started');
    this._creationStack = [];
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && !component.instance) {
        this._createSingleton(component);
      }
    }
    this._creationStack = null;
    this.logger.verbose('Creating singletons completed');
  }

  /**
   * Create a single singleton instance. Called recursively for constructor arg resolution.
   * Detects circular constructor dependencies via _creationStack.
   * @param {object} component - internal component record
   * @throws {Error} if circular constructor dependency detected
   */
  _createSingleton(component) {
    // Cycle detection for constructor injection
    if (this._creationStack.includes(component.name)) {
      const cycle = [...this._creationStack, component.name].join(' → ');
      const msg = `Circular dependency detected: ${cycle}`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    this._creationStack.push(component.name);

    if (component.isClass) {
      if (component.constructorArgs && Array.isArray(component.constructorArgs)) {
        const resolvedArgs = component.constructorArgs.map((arg) => {
          if (typeof arg === 'string' && this.components[arg]) {
            const dep = this.components[arg];
            // If dependency is a singleton that hasn't been created yet, create it now
            if (dep.scope === Scopes.SINGLETON && !dep.instance) {
              this._createSingleton(dep);
            }
            return dep.instance || dep.Reference;
          }
          return arg;
        });
        component.instance = new component.Reference(...resolvedArgs);
        this.logger.verbose(`Created singleton (${component.name}) with constructor args [${component.constructorArgs.join(', ')}]`);
      } else {
        component.instance = new component.Reference();
      }
    } else if (typeof component.factory === 'function') {
      let args = component.factoryArgs;
      if (!Array.isArray(args)) {
        args = [args];
      }
      // eslint-disable-next-line new-cap
      component.instance = new component.factory(...args);
    } else {
      component.instance = component.Reference;
    }
    this.logger.verbose(`Created singleton (${component.name})`);
    this._creationStack.pop();
  }

  resolveConfigPlaceHolder(placeholderArg) {
    const placeholder = placeholderArg.substring(2, placeholderArg.length - 1);
    const tuple = placeholder.split(':');
    const path = tuple[0];
    const rawDefault = tuple[1] || undefined;
    const defaultValue = rawDefault !== undefined
      ? (() => { try { return JSON.parse(rawDefault); } catch { return rawDefault; } })()
      : undefined;
    let returnValue = null;
    try {
      returnValue = this.config.get(path, defaultValue);
    } catch (e) {
      const msg = `Failed to resolve placeholder component property value (${path}) from config.`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    return returnValue;
  }

  /**
   * Autowire a component's dependencies by matching null instance properties
   * against registered component names (implicit autowiring), or properties
   * marked with 'Autowired' string value (explicit autowiring).
   * @param {object} instance - the component instance
   * @param {object} component - internal component record
   */
  autowireComponentDependencies(instance, component) {
    const insKeys = Object.keys(instance);
    for (let j = 0; j < insKeys.length; j++) {
      const property = instance[insKeys[j]];
      const autowire = property?.name === 'Autowired'
          || (typeof property === 'string' && property.toLowerCase()) === 'autowired';
      if (autowire) {
        // eslint-disable-next-line no-param-reassign
        instance[insKeys[j]] = this.get(insKeys[j], undefined, component);
        this.logger.verbose(`Explicitly autowired component (${component.name}) property (${insKeys[j]}) from context.`);
      } else if (instance[insKeys[j]] == null) {
        // eslint-disable-next-line no-param-reassign
        instance[insKeys[j]] = this.get(insKeys[j], (instance[insKeys[j]] || null), component);
        if (instance[insKeys[j]] != null) {
          this.logger.verbose(`Implicitly autowired null component (${component.name}) property (${insKeys[j]}) from context.`);
        }
      } else if (typeof instance[insKeys[j]] === 'string' && instance[insKeys[j]].startsWith('${')) {
        try {
          // eslint-disable-next-line no-param-reassign
          instance[insKeys[j]] = this.resolveConfigPlaceHolder(instance[insKeys[j]]);
        } catch (e) {
          const msg = `Failed to explicitly autowired placeholder component (${component.name}) property value (${insKeys[j]}) from config.`;
          this.logger.error(msg);
          throw new Error(msg);
        }
        this.logger.verbose(`Explicitly autowired placeholder component (${component.name}) property value (${insKeys[j]}) from config.`);
      }
    }
  }

  wireComponentProperty(component, propertyArg) {
    let property = propertyArg;
    if (propertyArg?.constructor?.name !== 'Property') {
      property = new Property();
      property.name = propertyArg.name;
      property.reference = propertyArg?.reference;
      property.value = propertyArg?.value;
      property.path = propertyArg?.path;
      property.defaultValue = propertyArg?.defaultValue;
      property.factory = propertyArg?.factory;
      property.function = propertyArg?.function;
      property.args = propertyArg?.args;
    }
    if (typeof property.name === 'string') {
      if (property.reference) {
        // eslint-disable-next-line no-param-reassign
        component.instance[property.name] = this.get(property.reference, undefined, component);
        this.logger.verbose(`Explicitly wired component (${component.name}) property (${property.name}) with context reference (${property.reference}).`);
      }
      if (property.value) {
        // eslint-disable-next-line no-param-reassign
        component.instance[property.name] = property.value;
        this.logger.verbose(`Explicitly wired component (${component.name}) property (${property.name}) with value (${property.value}).`);
      }
      if (property.path) {
        // eslint-disable-next-line no-param-reassign
        component.instance[property.name] = this.config.get(property.path, property.defaultValue);
        this.logger.verbose(`Explicitly wired component (${component.name}) property (${property.name}) from config path (${property.path}).`);
      }
    }
  }

  wireComponentDependencies(component) {
    if (component.properties) {
      if (!Array.isArray(component.properties)) {
        // eslint-disable-next-line no-param-reassign
        component.properties = [component.properties];
      }
      for (let i = 0; i < component.properties.length; i++) {
        this.wireComponentProperty(component, component.properties[i]);
      }
    }
  }

  /** Wire all singleton dependencies (autowire + explicit wiring). */
  injectSingletonDependencies() {
    this.logger.verbose('Injecting singletons dependencies started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        this.autowireComponentDependencies(component.instance, component);
        this.wireComponentDependencies(component);
      }
    }
    this.logger.verbose('Injecting singleton dependencies completed');
  }

  /**
   * Topological sort of singleton components respecting dependsOn declarations.
   * Components without dependsOn come first (in original order), then
   * components are ordered so dependencies are initialized before dependents.
   *
   * @returns {Array<string>} ordered component names
   */
  _topologicalSort() {
    const keys = Object.keys(this.components).filter(
      (k) => this.components[k].scope === Scopes.SINGLETON,
    );

    // Validate dependsOn references exist
    for (const key of keys) {
      const deps = this.components[key].dependsOn;
      if (deps) {
        const depList = Array.isArray(deps) ? deps : [deps];
        for (const dep of depList) {
          if (!this.components[dep]) {
            const msg = `Component (${key}) dependsOn (${dep}) which does not exist in the context`;
            this.logger.error(msg);
            throw new Error(msg);
          }
        }
      }
    }

    // Build adjacency list
    const graph = new Map();
    const inDegree = new Map();
    for (const key of keys) {
      graph.set(key, []);
      inDegree.set(key, 0);
    }
    for (const key of keys) {
      const deps = this.components[key].dependsOn;
      if (deps) {
        const depList = Array.isArray(deps) ? deps : [deps];
        for (const dep of depList) {
          if (graph.has(dep)) {
            graph.get(dep).push(key);
            inDegree.set(key, inDegree.get(key) + 1);
          }
        }
      }
    }

    // Kahn's algorithm
    const queue = keys.filter((k) => inDegree.get(k) === 0);
    const sorted = [];
    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(node);
      for (const neighbor of graph.get(node)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (sorted.length !== keys.length) {
      const remaining = keys.filter((k) => !sorted.includes(k));
      const msg = `Circular dependsOn detected involving: ${remaining.join(', ')}`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    return sorted;
  }

  /**
   * Initialise singletons in topological order (respecting dependsOn).
   * Calls setApplicationContext() (aware interface) then init() on each singleton.
   */
  initialiseSingletons() {
    this.logger.verbose('Initialising singletons started');
    const orderedKeys = this._topologicalSort();
    for (let i = 0; i < orderedKeys.length; i++) {
      const component = this.components[orderedKeys[i]];
      // Aware interface: inject ApplicationContext reference
      if (typeof component.instance?.setApplicationContext === 'function') {
        component.instance.setApplicationContext(this);
        this.logger.verbose(`Called setApplicationContext on singleton (${component.name})`);
      }

      if (typeof component.instance.init === 'function') {
        component.instance.init();
      } else if (typeof component.init === 'string') {
        component.instance[component.init]();
      }
      this.logger.verbose(`Initialised singleton (${component.name})`);
    }
    this.logger.verbose('Initialising singletons completed');
  }

  /**
   * Register a process-exit destroyer function.
   * @param {Function} destroyer - called on process exit (SIGINT/SIGTERM)
   */
  static registerDestroyer(destroyer) {
    if (typeof (process) !== 'undefined' && destroyer) {
      // process.on('exit', destroyer?.bind());
      // catches ctrl+c event
      process.on('SIGINT', destroyer?.bind());
      // catches "kill pid" (for example: nodemon restart)
      process.on('SIGUSR1', destroyer?.bind());
      process.on('SIGUSR2', destroyer?.bind());
      // catches uncaught exceptions
      process.on('uncaughtException', destroyer?.bind());
    }
  }

  /** Register stop() and destroy() methods on singletons for ordered shutdown. */
  async registerSingletonDestroyers() {
    this.logger.verbose('Registering singleton destroyers started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        let destroyer = null;
        if (typeof component.instance.stop === 'function') {
          const stopper = () => component.instance.stop(component.instance);
          ApplicationContext.registerDestroyer(stopper);
          this.logger.verbose(`Registering singleton (${component.name}) stop lifecycle`);
        }
        if (typeof component.instance.destroy === 'function') {
          destroyer = () => component.instance.destroy(component.instance);
        } else if (typeof component.destroy === 'string') {
          destroyer = () => component.instance[component.destroy](component.instance);
        }
        ApplicationContext.registerDestroyer(destroyer);
        this.logger.verbose(`Registering singleton (${component.name}) destroyer`);
      }
    }
    // Register context shutdown: publish ContextClosedEvent, then log completion
    ApplicationContext.registerDestroyer(() => {
      this.publishContextClosedEvent();
      this.logger.verbose(`ApplicationContext (${this.name}) lifecycle completed.`);
    });
    this.logger.verbose('Registering singleton destroyers completed');
  }

  /**
   * Auto-register ApplicationEventPublisher as a context-managed singleton
   * if not already provided by user configuration.
   */
  /** Register the ApplicationEventPublisher as a context singleton. */
  registerEventPublisher() {
    if (!this.components.applicationEventPublisher) {
      this.eventPublisher = new ApplicationEventPublisher();
      this.components.applicationEventPublisher = {
        name: 'applicationEventPublisher',
        scope: Scopes.SINGLETON,
        isClass: false,
        instance: this.eventPublisher,
        properties: [],
        profiles: [],
        isActive: true,
      };
      this.logger.verbose('Registered applicationEventPublisher as context singleton');
    } else {
      this.eventPublisher = this.components.applicationEventPublisher.instance;
    }
  }

  /**
   * Find all singleton components whose instances are BeanPostProcessors.
   * Stores them in order for lifecycle hook invocation.
   */
  /** Find BeanPostProcessor instances among registered singletons. */
  detectBeanPostProcessors() {
    this.beanPostProcessors = [];
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && component.instance instanceof BeanPostProcessor) {
        this.beanPostProcessors.push(component);
        this.logger.verbose(`Detected BeanPostProcessor (${component.name})`);
      }
    }
  }

  /**
   * Call postProcessBeforeInitialization on all BeanPostProcessors for each
   * singleton (except BeanPostProcessors themselves — they're already initialized).
   */
  postProcessBeforeInitialization() {
    if (this.beanPostProcessors.length === 0) return;
    this.logger.verbose('Post-process before initialization started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && !(component.instance instanceof BeanPostProcessor)) {
        for (let j = 0; j < this.beanPostProcessors.length; j++) {
          const bpp = this.beanPostProcessors[j];
          const result = bpp.instance.postProcessBeforeInitialization(component.instance, component.name);
          if (result !== undefined && result !== null) {
            component.instance = result;
          }
          this.logger.verbose(`BeanPostProcessor (${bpp.name}) postProcessBeforeInitialization called for (${component.name})`);
        }
      }
    }
    this.logger.verbose('Post-process before initialization completed');
  }

  /**
   * Call postProcessAfterInitialization on all BeanPostProcessors for each
   * singleton (except BeanPostProcessors themselves).
   */
  postProcessAfterInitialization() {
    if (this.beanPostProcessors.length === 0) return;
    this.logger.verbose('Post-process after initialization started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && !(component.instance instanceof BeanPostProcessor)) {
        for (let j = 0; j < this.beanPostProcessors.length; j++) {
          const bpp = this.beanPostProcessors[j];
          const result = bpp.instance.postProcessAfterInitialization(component.instance, component.name);
          if (result !== undefined && result !== null) {
            component.instance = result;
          }
          this.logger.verbose(`BeanPostProcessor (${bpp.name}) postProcessAfterInitialization called for (${component.name})`);
        }
      }
    }
    this.logger.verbose('Post-process after initialization completed');
  }

  /**
   * Detect singletons with an onApplicationEvent method and subscribe them
   * to all events via the event publisher.
   */
  /** Find singletons with onApplicationEvent() method and register them as event listeners. */
  detectEventListeners() {
    if (!this.eventPublisher) return;
    this.logger.verbose('Detecting event listeners started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON
          && component.instance
          && typeof component.instance.onApplicationEvent === 'function') {
        this.eventPublisher.on('*', (event) => component.instance.onApplicationEvent(event));
        this.logger.verbose(`Registered event listener (${component.name}) via onApplicationEvent convention`);
      }
    }
    this.logger.verbose('Detecting event listeners completed');
  }

  /**
   * Publish ContextRefreshedEvent after prepare() completes.
   */
  publishContextRefreshedEvent() {
    if (!this.eventPublisher) return;
    const event = new ContextRefreshedEvent(this);
    this.eventPublisher.publish(event);
    this.logger.verbose(`Published ContextRefreshedEvent for ApplicationContext (${this.name})`);
  }

  /**
   * Publish ContextClosedEvent during shutdown.
   */
  publishContextClosedEvent() {
    if (!this.eventPublisher) return;
    const event = new ContextClosedEvent(this);
    this.eventPublisher.publish(event);
    this.logger.verbose(`Published ContextClosedEvent for ApplicationContext (${this.name})`);
  }

  /**
   * Run phase: call start() then run() on singletons that implement the lifecycle interface.
   * @param {object} [options]
   * @param {boolean} [options.run=true] - if false, skip the run phase entirely
   */
  async run(options) {
    if (!(options) || options?.run) {
      this.logger.verbose(`ApplicationContext (${this.name}) lifecycle run phase started.`);

      const keys = Object.keys(this.components);
      for (let i = 0; i < keys.length; i++) {
        const component = this.components[keys[i]];
        if (component.scope === Scopes.SINGLETON) {
          // Lifecycle interface: start()
          if (typeof component.instance.start === 'function'
              && component.instance.start !== this.start) {
            component.instance.start();
            this.logger.verbose(`Started lifecycle component (${component.name})`);
          }

          if (typeof component.run === 'string') {
            component.instance[component.run]();
          } else if (typeof component.instance.run === 'function') {
            component.instance.run();
          }
        }

        this.logger.verbose(`ApplicationContext (${this.name}) lifecycle run phase completed.`);
      }
    } else {
      this.logger.verbose(`ApplicationContext (${this.name}) skipping lifecycle run phase.`);
    }
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle completed.`);
  }

  /**
   * Retrieve a component instance by name.
   *
   * For singletons, returns the existing instance. For prototypes, creates a new
   * instance on each call. If the component is not found, returns defaultValue or
   * throws if no default is provided.
   *
   * @param {string} reference - component name
   * @param {*} [defaultValue] - returned if component not found
   * @param {*} [targetArgs] - arguments passed to prototype factory functions
   * @returns {*} the component instance
   * @throws {Error} if component not found and no defaultValue provided
   */
  get(reference, defaultValue, targetArgs) {
    if (this.components[reference]) {
      this.logger.verbose(`Found component (${reference})`);
      if (this.components[reference].scope === Scopes.SINGLETON) {
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.SINGLETON}), returning existing instance.`);
        return this.components[reference].instance;
      }
      let prototype = null;
      if (this.components[reference].isClass) {
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.PROTOTYPE}), returning new instance.`);
        prototype = new this.components[reference].Reference();
      } else if (typeof this.components[reference].Reference === 'function') {
        let args = targetArgs || this.components[reference].factoryArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.components[reference].Reference(...args);
      } else if (typeof this.components[reference].factory === 'function') {
        let args = this.components[reference].factoryArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.components[reference].factory(...args);
      } else if (typeof this.components[reference].factory === 'string' && typeof this.components[reference].factoryFunction === 'string') {
        let args = this.components[reference].factoryArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.get(
          this.components[reference].factory,
        )[this.components[reference].factoryFunction](...args);
      } else if (typeof this.components[reference].wireFactory === 'function') {
        let args = targetArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.components[reference].wireFactory(...args);
      } else if (typeof this.components[reference].wireFactory === 'string' && typeof this.components[reference].factoryFunction === 'string') {
        let args = targetArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        const factory = this.get(this.components[reference].wireFactory);
        prototype = factory[this.components[reference].factoryFunction](...args);
      } else {
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.PROTOTYPE}), returning reference.`);
        prototype = this.components[reference].Reference;
      }
      this.autowireComponentDependencies(prototype, this.components[reference]);
      return prototype;
    }
    if (typeof defaultValue === 'undefined') {
      const msg = `Failed component reference lookup for (${reference})`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    return defaultValue;
  }
}

/**
 * Auto-Discovery — Pure JS component scanning for @alt-javascript/cdi
 *
 * Classes declare static __component to self-identify as context components.
 * The scan() function reads this metadata and returns component definitions.
 * ComponentRegistry provides programmatic registration as a complement.
 */

/** Metadata key — classes declare this as a static property to opt in. */
const COMPONENT_META_KEY = '__component';

/**
 * Programmatic component registry.
 * Register classes/objects here and drain during ApplicationContext startup.
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
  }

  /**
   * Register a class or object as a component.
   *
   * @param {Function|Object} target — class constructor or plain object
   * @param {Object} [options] — component options (scope, name, profiles, properties, etc.)
   * @returns {Function|Object} the target (for chaining)
   */
  register(target, options) {
    const name = options?.name
      || (target?.name ? target.name.charAt(0).toLowerCase() + target.name.slice(1) : undefined);

    if (!name) {
      throw new Error('ComponentRegistry.register: name is required (provide options.name or use a named class)');
    }

    const meta = {
      Reference: target,
      name,
      scope: options?.scope || 'singleton',
      qualifier: options?.qualifier,
      profiles: options?.profiles,
      properties: options?.properties,
      condition: options?.condition,
      factory: options?.factory,
      factoryFunction: options?.factoryFunction,
      factoryArgs: options?.factoryArgs,
      wireFactory: options?.wireFactory,
      require: options?.require,
    };

    this.components.set(name, meta);
    return target;
  }

  /**
   * Drain all registered components as an array. Clears the registry.
   * @returns {Array}
   */
  drain() {
    const result = Array.from(this.components.values());
    this.components.clear();
    return result;
  }

  /** @returns {number} */
  get size() {
    return this.components.size;
  }

  /** Clear all registrations. */
  clear() {
    this.components.clear();
  }
}

/** Default singleton registry instance. */
const defaultRegistry = new ComponentRegistry();

/**
 * Scan classes for static __component metadata and return component definitions.
 *
 * @param {Array<Function|Object>} classes — classes to scan
 * @returns {Array} component definitions
 */
function scan(classes) {
  const components = [];

  for (const cls of classes) {
    if (cls == null) continue;

    const meta = cls[COMPONENT_META_KEY];
    if (meta == null) continue;

    const options = meta === true ? {}
      : (typeof meta === 'string' ? { scope: meta } : meta);

    const name = options.name
      || (cls.name ? cls.name.charAt(0).toLowerCase() + cls.name.slice(1) : undefined);

    if (!name) continue;

    components.push({
      Reference: cls,
      name,
      scope: options.scope || 'singleton',
      qualifier: options.qualifier,
      profiles: options.profiles,
      properties: options.properties,
      condition: options.condition,
    });
  }

  return components;
}

/**
 * Convenience: scan classes AND drain the default registry, merged.
 *
 * @param {Array<Function|Object>} [classes] — classes to scan
 * @returns {Array} merged component definitions
 */
function discover(classes) {
  const scanned = classes ? scan(classes) : [];
  const registered = defaultRegistry.drain();
  return [...scanned, ...registered];
}

/**
 * Conditions — Conditional bean registration for @alt-javascript/cdi
 *
 * Condition functions return predicates evaluated during context preparation
 * to decide whether a component should be registered.
 */

/**
 * Register only if a config property has the expected value.
 *
 * @param {string} path — config property path (dot notation)
 * @param {*} [expectedValue] — expected value (if omitted, checks existence only)
 * @param {*} [matchIfMissing=false] — register if property doesn't exist
 * @returns {Function} condition predicate(config, components)
 */
function conditionalOnProperty(path, expectedValue, matchIfMissing = false) {
  return function conditionOnProperty(config) {
    if (!config || typeof config.has !== 'function') {
      return matchIfMissing;
    }
    if (!config.has(path)) {
      return matchIfMissing;
    }
    if (typeof expectedValue === 'undefined') {
      return true;
    }
    const actual = config.get(path);
    return actual === expectedValue || String(actual) === String(expectedValue);
  };
}

/**
 * Register only if a bean with the given name is NOT already registered.
 *
 * @param {string} beanName
 * @returns {Function} condition predicate(config, components)
 */
function conditionalOnMissingBean(beanName) {
  return function conditionOnMissingBean(config, components) {
    return !components || !components[beanName];
  };
}

/**
 * Register only if a bean with the given name IS already registered.
 *
 * @param {string} beanName
 * @returns {Function} condition predicate(config, components)
 */
function conditionalOnBean(beanName) {
  return function conditionOnBean(config, components) {
    return components && !!components[beanName];
  };
}

/**
 * Register only if a class reference is available.
 *
 * @param {string|Function} classRef — class constructor or global name string
 * @returns {Function} condition predicate(config, components)
 */
function conditionalOnClass(classRef) {
  return function conditionOnClass() {
    if (typeof classRef === 'function') return true;
    if (typeof classRef === 'string') {
      try {
        return typeof globalThis[classRef] !== 'undefined';
      } catch {
        return false;
      }
    }
    return false;
  };
}

/**
 * Compose conditions with AND logic.
 *
 * @param {...Function} conditions
 * @returns {Function} combined condition predicate
 */
function allOf(...conditions) {
  return function combinedCondition(config, components, activeProfiles) {
    return conditions.every((c) => c(config, components, activeProfiles));
  };
}

/**
 * Compose conditions with OR logic.
 *
 * @param {...Function} conditions
 * @returns {Function} combined condition predicate
 */
function anyOf(...conditions) {
  return function combinedCondition(config, components, activeProfiles) {
    return conditions.some((c) => c(config, components, activeProfiles));
  };
}

/**
 * Register only if one or more profiles are active.
 * Supports negation: '!test' means "register if 'test' is NOT active".
 *
 * Analogous to Spring's @Profile annotation.
 *
 * @param {...string} profileNames — profile names (prefix with ! for negation)
 * @returns {Function} condition predicate(config, components, activeProfiles)
 *
 * @example
 * // Active when 'production' profile is active
 * { condition: conditionalOnProfile('production') }
 *
 * // Active when 'test' profile is NOT active
 * { condition: conditionalOnProfile('!test') }
 *
 * // Active when 'dev' OR 'staging' profile is active
 * { condition: conditionalOnProfile('dev', 'staging') }
 */
function conditionalOnProfile(...profileNames) {
  return function conditionOnProfile(config, components, activeProfiles) {
    const active = activeProfiles || [];
    const positive = profileNames.filter((p) => !p.startsWith('!'));
    const negated = profileNames.filter((p) => p.startsWith('!')).map((p) => p.substring(1));

    // All negations must hold (none of the negated profiles are active)
    const negationsPass = negated.length === 0
      || negated.every((n) => !active.includes(n));

    // At least one positive profile must be active (if any specified)
    const positivesPass = positive.length === 0
      || positive.some((p) => active.includes(p));

    return negationsPass && positivesPass;
  };
}

/**
 * Filter component definitions by evaluating their conditions.
 *
 * @param {Array} componentDefs — component definitions with optional `condition`
 * @param {Object} config — config with has()/get()
 * @param {Object} [components={}] — existing registered components
 * @param {string[]} [activeProfiles=[]] — active profile names
 * @returns {Array} filtered definitions
 */
function evaluateConditions(componentDefs, config, components = {}, activeProfiles = []) {
  return componentDefs.filter((def) => {
    if (!def.condition) return true;
    if (typeof def.condition === 'function') {
      return def.condition(config, components, activeProfiles);
    }
    return true;
  });
}

/**
 * AOP — Proxy-based method interception for @alt-javascript/cdi
 *
 * Uses JavaScript Proxy to intercept method calls with before, after,
 * afterReturning, afterThrowing, and around advice types.
 */

/**
 * Match a method name against a pattern.
 *
 * @param {string} methodName
 * @param {string|RegExp|Function} pattern — exact name, wildcard ('get*'), regex, or predicate
 * @returns {boolean}
 */
function matchMethod(methodName, pattern) {
  if (typeof pattern === 'string') {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(methodName);
    }
    return methodName === pattern;
  }
  if (pattern instanceof RegExp) {
    return pattern.test(methodName);
  }
  if (typeof pattern === 'function') {
    return pattern(methodName);
  }
  return false;
}

/**
 * Create an AOP proxy around a target object.
 *
 * @param {Object} target — the object to proxy
 * @param {Array<Object>} aspects — array of aspect definitions, each with:
 *   - pointcut: string|RegExp|Function — which methods to intercept
 *   - before: Function(args, methodName, target) — called before method
 *   - after: Function(result, args, methodName, target) — called after (always)
 *   - afterReturning: Function(result, args, methodName, target) — after success
 *   - afterThrowing: Function(error, args, methodName, target) — after exception
 *   - around: Function(proceed, args, methodName, target) — wraps entire call
 * @returns {Proxy} proxied object
 */
function createProxy(target, aspects) {
  if (!target || typeof target !== 'object') {
    throw new Error('createProxy: target must be an object');
  }
  if (!Array.isArray(aspects) || aspects.length === 0) {
    return target;
  }

  return new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver);

      if (typeof value !== 'function') {
        return value;
      }

      const matchingAspects = aspects.filter((a) => matchMethod(prop, a.pointcut));
      if (matchingAspects.length === 0) {
        return value;
      }

      return function intercepted(...args) {
        const methodName = prop;

        // Before advice
        for (const aspect of matchingAspects) {
          if (aspect.before) {
            aspect.before(args, methodName, obj);
          }
        }

        // Build proceed chain for around advice
        let proceed = () => value.apply(obj, args);
        const aroundAspects = matchingAspects.filter((a) => a.around);
        for (let i = aroundAspects.length - 1; i >= 0; i--) {
          const currentProceed = proceed;
          const aspect = aroundAspects[i];
          proceed = () => aspect.around(currentProceed, args, methodName, obj);
        }

        let result;
        let error;
        try {
          result = proceed();

          for (const aspect of matchingAspects) {
            if (aspect.afterReturning) {
              aspect.afterReturning(result, args, methodName, obj);
            }
          }
        } catch (e) {
          error = e;
          for (const aspect of matchingAspects) {
            if (aspect.afterThrowing) {
              aspect.afterThrowing(e, args, methodName, obj);
            }
          }
        } finally {
          for (const aspect of matchingAspects) {
            if (aspect.after) {
              aspect.after(error || result, args, methodName, obj);
            }
          }
        }

        if (error) {
          throw error;
        }
        return result;
      };
    },
  });
}

export { ApplicationContext, ApplicationEvent, ApplicationEventPublisher, BeanPostProcessor, COMPONENT_META_KEY, Component, ComponentRegistry, Context, ContextClosedEvent, ContextRefreshedEvent, Property, Prototype, Scopes, Service, Singleton, Transient, allOf, anyOf, conditionalOnBean, conditionalOnClass, conditionalOnMissingBean, conditionalOnProfile, conditionalOnProperty, createProxy, defaultRegistry, discover, evaluateConditions, matchMethod, scan };
