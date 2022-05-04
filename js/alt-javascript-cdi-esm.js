import _ from 'https://cdn.jsdelivr.net/npm/lodash-es/lodash.min.js';
import { LoggerFactory } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@2/dist/alt-javascript-logger-esm.js';
import { ConfigFactory } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@2/dist/alt-javascript-config-esm.js';

/* eslint-disable import/extensions */
class Context {
    constructor(components,profile) {
        this.components = (components || []) ;
        this.components = (_.isArray(this.components) ? this.components : [this.components]) ;
        this.profile = profile;
    }
}

class Component {
    constructor(options) {
        this.Reference = options?.Reference || (options.factory || options.wireFactory ? null : options );
        this.name = options?.name;
        this.qualifier = options?.qualifier;
        this.scope = options?.scope;
        this.properties = options?.properties;
        this.profiles = options?.profiles;
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

const Property = class Property {
  constructor(options) {
    this.name = options?.name;
    this.reference = options?.ref || options?.reference;
    this.value = options?.value;
    this.defaultValue = options?.defaultValue;
  }
};

class Scopes {
    static SINGLETON = 'singleton';
    static SERVICE = 'singleton';
    static PROTOTYPE = 'prototype';
    static TRANSIENT = 'prototype';
}

/* eslint-disable import/extensions */

class ApplicationContext {
  // eslint-disable-next-line
  static DEFAULT_CONTEXT_NAME = 'default';

  static DEFAULT_CONFIG_CONTEXT_PATH = 'context';

  static getGlobalRef() {
    let $globalref = null;
    if (ApplicationContext.detectBrowser()) {
      $globalref = window;
    } else {
      $globalref = global;
    }
    return $globalref;
  }

  static getGlobalRoot(key) {
    const $globalref = ApplicationContext.getGlobalRef();
    let $key = ($globalref && $globalref.boot);
    $key = $key && $key.contexts;
    $key = $key && $key.root;
    $key = $key && $key[`${key}`];
    return $key;
  }

  static detectBrowser() {
    const browser = !(typeof window === 'undefined');
    return browser;
  }

  constructor(options) {
    const contexts = options?.contexts || options;
    if (Array.isArray(contexts)) {
      this.contexts = contexts;
    } else {
      this.contexts = (contexts ? [contexts] : []);
    }
    this.components = {};
    this.profiles = options?.profiles;
    this.name = options?.name || ApplicationContext.DEFAULT_CONTEXT_NAME;
    this.configContextPath = options?.configContextPath
        || (typeof (process) !== 'undefined' && process?.env?.NODE_CONFIG_CONTEXT_PATH)
        || ApplicationContext.DEFAULT_CONFIG_CONTEXT_PATH;
    this.config = options?.config || ConfigFactory.getConfig({});
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

  async start() {
    await this.lifeCycle();
  }

  async lifeCycle() {
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle started.`);
    await this.parseContexts();
    this.createSingletons();
    this.injectSingletonDependencies();
    this.initialiseSingletons();
    this.registerSingletonDestroyers();
    return this.run();
  }

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

  detectGlobalContextComponents() {
    this.logger.verbose('Detecting global context components started.');

    if (!this.components.config && ApplicationContext.getGlobalRoot('config')) {
      this.deriveContextComponent({
        Reference: ApplicationContext.getGlobalRoot('config'),
        name: 'config',
      });
    }
    if (!this.components.loggerFactory && ApplicationContext.getGlobalRoot('loggerFactory')) {
      this.deriveContextComponent({
        Reference: ApplicationContext.getGlobalRoot('loggerFactory'),
        name: 'loggerFactory',
      });
    }
    if (!this.components.loggerCategoryCache && ApplicationContext.getGlobalRoot('loggerCategoryCache')) {
      this.deriveContextComponent({
        Reference: ApplicationContext.getGlobalRoot('loggerCategoryCache'),
        name: 'loggerCategoryCache',
      });
    }
    if (!this.components.logger) {
      this.deriveContextComponent({
        scope: Scopes.PROTOTYPE,
        wireFactory: 'loggerFactory',
        factoryFunction: 'getLogger',
        name: 'logger',
      });
    }
    if (!this.components.fetch && ApplicationContext.getGlobalRoot('fetch')) {
      this.deriveContextComponent({
        Reference: ApplicationContext.getGlobalRoot('fetch'),
        name: 'fetch',
      });
    }

    this.logger.verbose('Detecting global context components completed.');
  }

  async parseContexts() {
    this.logger.verbose('Parsing configured contexts started.');
    this.detectConfigContext();
    for (let i = 0; i < this.contexts.length; i++) {
      if (this.contexts[i]) {
        if (this.contexts[i]?.constructor?.name === 'Context') {
          await this.parseContextComponents(this.contexts[i]);
        } else {
          await this.parseContextComponents(new Context(this.contexts[i]));
        }
      } else {
        const msg = `ApplicationContext (${this.name}) received a nullish context.`;
        this.logger.error(msg);
        throw new Error(msg);
      }
    }
    this.detectGlobalContextComponents();
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
        await this.parseContextComponent(component);
      }
    }
  }

  async parseContextComponents(context) {
    this.logger.verbose('Processing context components started');
    if (context.components) {
      if (Array.isArray(context.components)) {
        for (let i = 0; i < context.components.length; i++) {
          await this.deriveContextComponent(context.components[i]);
        }
      }
    }
    this.logger.verbose('Processing context components completed');
  }

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

    $component.name = _.lowerFirst(component.name) || _.lowerFirst(constructr.name);
    $component.qualifier = component.qualifier || _.lowerFirst(constructr?.qualifier);
    $component.scope = component.scope || _.lowerFirst(constructr?.scope) || Scopes.SINGLETON;
    $component.Reference = component.Reference;
    $component.factory = component.factory;
    $component.factoryFunction = component.factoryFunction;
    $component.factoryArgs = component.factoryArgs;
    $component.wireFactory = component.wireFactory;
    // TODO - dynamic import (async)
    if (component.require) {
      try{
      // eslint-disable-next-line
        let module = await import(component.require);
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
      $component.isActive = _.intersection(activeProfiles, $component.profiles).length > 0;
      if ($component.isActive === false) {
        let negations = _.filter($component.profiles, (profile) => profile.startsWith('!'));
        negations = _.map(negations, (profile) => profile.substring(1));
        $component.isActive = negations.length > 0
            && _.intersection(activeProfiles, negations).length === 0;
      }
    }

    if ($component.isActive) {
      if (!this.components[$component.name]) {
        this.components[$component.name] = $component;
        this.logger.verbose(`Added application context component (${$component.name}) with ${$component.scope} scope`);
      } else {
        const msg = `Duplicate definition of application context component (${$component.name})`;
        this.logger.error(msg);
        throw new Error(msg);
      }
    } else {
      this.logger.verbose(`Skipped inactive application context component (${$component.name}), with scope ${$component.scope}`);
    }
  }

  createSingletons() {
    this.logger.verbose('Creating singletons started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        if (component.isClass) {
          component.instance = new component.Reference();
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
      }
    }
    this.logger.verbose('Creating singletons completed');
  }

  resolveConfigPlaceHolder(placeholderArg) {
    const placeholder = placeholderArg.substring(2, placeholderArg.length - 1);
    const tuple = placeholder.split(':');
    const path = tuple[0];
    const defaultValue = tuple[1] || undefined;
    let returnValue = null;
    try {
      returnValue = this.config.get(path, defaultValue ? JSON.parse(defaultValue) : defaultValue);
    } catch (e) {
      const msg = `Failed to resolve placeholder component property value (${path}) from config.`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    return returnValue;
  }

  autowireComponentDependencies(instance, component) {
    const insKeys = Object.keys(instance);
    for (let j = 0; j < insKeys.length; j++) {
      const property = instance[insKeys[j]];
      const autowire = property?.name === 'Autowired'
          || (typeof property === 'string' && _.lowerCase(property)) === 'autowired';
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

  initialiseSingletons() {
    this.logger.verbose('Initialising singletons started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        if (typeof component.instance.init === 'function') {
          component.instance.init();
        } else if (typeof component.init === 'string') {
          component.instance[component.init]();
        }
        this.logger.verbose(`Initialised singleton (${component.name})`);
      }
    }
    this.logger.verbose('Initialising singletons completed');
  }

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

  async registerSingletonDestroyers() {
    this.logger.verbose('Registering singleton destroyers started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        let destroyer = null;
        if (typeof component.instance.destroy === 'function') {
          destroyer = () => component.instance.destroy(component.instance);
        } else if (typeof component.destroy === 'string') {
          destroyer = () => component.instance[component.destroy](component.instance);
        }
        ApplicationContext.registerDestroyer(destroyer);
        this.logger.verbose(`Registering singleton (${component.name}) destroyer`);
      }
    }
    ApplicationContext.registerDestroyer(() => {
      this.logger.verbose(`ApplicationContext (${this.name}) lifecycle completed.`);
    });
    this.logger.verbose('Registering singleton destroyers completed');
  }

  async run() {
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        if (typeof component.instance.run === 'function') {
          component.instance.run();
        } else if (typeof component.run === 'string') {
          component.instance[component.run]();
        }
      }
    }
    this.logger.verbose('Application context started');
  }

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
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.PROTOTYPE}), returning deep clone.`);
        prototype = _.cloneDeep(this.components[reference].Reference);
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

export { ApplicationContext };
