import { isPlainObject, getGlobalRoot, detectBrowser } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js';
import { config } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js';

/** Logger that delegates all calls to a provider object — base for pluggable logger backends. */
class DelegatingLogger {
  constructor(provider) {
    this.provider = provider;
    if (!this.provider) {
      throw new Error('provider is required');
    }
  }

  setLevel(level) {
    this.provider.setLevel(level);
  }

  log(level, message, meta) {
    this.provider.log(message, meta);
  }

  debug(message, meta) {
    this.provider.debug(message, meta);
  }

  verbose(message, meta) {
    this.provider.verbose(message, meta);
  }

  info(message, meta) {
    this.provider.info(message, meta);
  }

  warn(message, meta) {
    this.provider.warn(message, meta);
  }

  error(message, meta) {
    this.provider.error(message, meta);
  }

  fatal(message, meta) {
    this.provider.fatal(message, meta);
  }

  isLevelEnabled(level) {
    return this.provider.isLevelEnabled(level);
  }

  isFatalEnabled() {
    return this.provider.isFatalEnabled();
  }

  isErrorEnabled() {
    return this.provider.isErrorEnabled();
  }

  isWarnEnabled() {
    return this.provider.isWarnEnabled();
  }

  isInfoEnabled() {
    return this.provider.isInfoEnabled();
  }

  isDebugEnabled() {
    return this.provider.isDebugEnabled();
  }

  isVerboseEnabled() {
    return this.provider.isVerboseEnabled();
  }
}

/** Logger level constants and utilities (fatal=0 through debug=5). */
var LoggerLevel = {
  ENUMS: {
    fatal: 0, error: 1, warn: 2, info: 3, verbose: 4, debug: 5,
  },
  DEBUG: 'debug',
  VERBOSE: 'verbose',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
};

/* eslint-disable import/extensions */

/** Base logger with level-gated logging methods (debug, verbose, info, warn, error, fatal). */
class Logger {
  static DEFAULT_CATEGORY = 'ROOT'

  constructor(category, level, levels) {
    this.category = category || Logger.DEFAULT_CATEGORY;
    this.levels = levels || LoggerLevel.ENUMS;
    this.level = this.levels[level || LoggerLevel.INFO];
  }

  setLevel(level) {
    this.level = this.levels[level || LoggerLevel.INFO];
  }

  isLevelEnabled(level) {
    return this.levels[level] <= this.level;
  }

  isFatalEnabled() {
    return this.isLevelEnabled(LoggerLevel.FATAL);
  }

  isErrorEnabled() {
    return this.isLevelEnabled(LoggerLevel.ERROR);
  }

  isWarnEnabled() {
    return this.isLevelEnabled(LoggerLevel.WARN);
  }

  isInfoEnabled() {
    return this.isLevelEnabled(LoggerLevel.INFO);
  }

  isDebugEnabled() {
    return this.isLevelEnabled(LoggerLevel.DEBUG);
  }

  isVerboseEnabled() {
    return this.isLevelEnabled(LoggerLevel.VERBOSE);
  }
}

/* eslint-disable import/extensions */

/** Logger that reads its level from config at a configurable path (default: 'logging'). */
class ConfigurableLogger extends DelegatingLogger {
  static DEFAULT_CONFIG_PATH = 'logging.level';

  constructor(config, provider, category, configPath, cache) {
    super(provider);
    this.config = config;
    if (!this.config) {
      throw new Error('config is required');
    }
    this.category = category || Logger.DEFAULT_CATEGORY;
    this.configPath = configPath || ConfigurableLogger.DEFAULT_CONFIG_PATH;
    this.cache = cache;
    if (!this.cache) {
      throw new Error('cache is required');
    }
    this.provider.setLevel(
      ConfigurableLogger.getLoggerLevel(
        this.category,
        this.configPath,
        this.config,
        this.cache,
      ),
    );

    ConfigurableLogger.prototype.setLevel = DelegatingLogger.prototype.setLevel;
    ConfigurableLogger.prototype.log = DelegatingLogger.prototype.log;
    ConfigurableLogger.prototype.debug = DelegatingLogger.prototype.debug;
    ConfigurableLogger.prototype.verbose = DelegatingLogger.prototype.verbose;
    ConfigurableLogger.prototype.info = DelegatingLogger.prototype.info;
    ConfigurableLogger.prototype.warn = DelegatingLogger.prototype.warn;
    ConfigurableLogger.prototype.error = DelegatingLogger.prototype.error;
    ConfigurableLogger.prototype.fatal = DelegatingLogger.prototype.fatal;

    ConfigurableLogger.prototype.isLevelEnabled = DelegatingLogger.prototype.isLevelEnabled;
    ConfigurableLogger.prototype.isDebugEnabled = DelegatingLogger.prototype.isDebugEnabled;
    ConfigurableLogger.prototype.isVerboseEnabled = DelegatingLogger.prototype.isVerboseEnabled;
    ConfigurableLogger.prototype.isInfoEnabled = DelegatingLogger.prototype.isInfoEnabled;
    ConfigurableLogger.prototype.isWarnEnabled = DelegatingLogger.prototype.isWarnEnabled;
    ConfigurableLogger.prototype.isErrorEnabled = DelegatingLogger.prototype.isErrorEnabled;
    ConfigurableLogger.prototype.isFatalEnabled = DelegatingLogger.prototype.isFatalEnabled;
  }

  static getLoggerLevel(category, configPath, config, cache) {
    let level = 'info';
    const path = configPath || ConfigurableLogger.DEFAULT_CONFIG_PATH;
    const categories = (category || '').split('/');
    let pathStep = path;

    const root = `${pathStep}./`;
    if (cache.get(root)) {
      level = cache.get(root);
    } else if (config.has(root)) {
      level = config.get(root);
      cache.put(root, level);
    }

    for (let i = 0; i < categories.length; i++) {
      pathStep = `${pathStep}${i === 0 ? '.' : '/'}${categories[i]}`;
      if (cache.get(pathStep)) {
        level = cache.get(pathStep);
      } else if (config.has(pathStep)) {
        level = config.get(pathStep);
        cache.put(pathStep, level);
      }
    }
    return level;
  }
}

/** Formats log entries as JSON strings (timestamp, category, level, message, meta). */
class JSONFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(timestamp, category, level, message, meta) {
    return JSON.stringify(
      {
        level,
        message,
        timestamp,
        category,
        ...(isPlainObject(meta) ? meta : { meta }),
      },
    );
  }
}

/* eslint-disable import/extensions */

/** Logger implementation that writes to the console (process.stdout/stderr or console object). */
class ConsoleLogger extends Logger {
  constructor(category, level, levels, meta, formatter, consoleArg) {
    super(category, level, levels);
    this.formatter = formatter || new JSONFormatter();
    this.meta = meta || {};
    this.console = consoleArg || console;

    ConsoleLogger.prototype.setLevel = Logger.prototype.setLevel;
    ConsoleLogger.prototype.isLevelEnabled = Logger.prototype.isLevelEnabled;
    ConsoleLogger.prototype.isDebugEnabled = Logger.prototype.isDebugEnabled;
    ConsoleLogger.prototype.isVerboseEnabled = Logger.prototype.isVerboseEnabled;
    ConsoleLogger.prototype.isInfoEnabled = Logger.prototype.isInfoEnabled;
    ConsoleLogger.prototype.isWarnEnabled = Logger.prototype.isWarnEnabled;
    ConsoleLogger.prototype.isErrorEnabled = Logger.prototype.isErrorEnabled;
    ConsoleLogger.prototype.isFatalEnabled = Logger.prototype.isFatalEnabled;
  }

  log(level, message, meta) {
    if (this.levels[level] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.log(this.formatter.format((new Date()), this.category, level, message, meta));
    }
  }

  debug(message, meta) {
    if (this.levels[LoggerLevel.DEBUG] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.debug(
        this.formatter.format((new Date()), this.category, LoggerLevel.DEBUG, message, meta),
      );
    }
  }

  verbose(message, meta) {
    if (this.levels[LoggerLevel.VERBOSE] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.info(
        this.formatter.format((new Date()), this.category, LoggerLevel.VERBOSE, message, meta),
      );
    }
  }

  info(message, meta) {
    if (this.levels[LoggerLevel.INFO] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.info(
        this.formatter.format((new Date()), this.category, LoggerLevel.INFO, message, meta),
      );
    }
  }

  warn(message, meta) {
    if (this.levels[LoggerLevel.WARN] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.warn(
        this.formatter.format((new Date()), this.category, LoggerLevel.WARN, message, meta),
      );
    }
  }

  error(message, meta) {
    if (this.levels[LoggerLevel.ERROR] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.error(
        this.formatter.format((new Date()), this.category, LoggerLevel.ERROR, message, meta),
      );
    }
  }

  fatal(message, meta) {
    if (this.levels[LoggerLevel.FATAL] <= this.level) {
      // eslint-disable-next-line no-console
      this.console.error(
        this.formatter.format((new Date()), this.category, LoggerLevel.FATAL, message, meta),
      );
    }
  }
}

/** Caches logger instances by category to avoid redundant construction. */
class LoggerCategoryCache {
  constructor() {
    this.cache = {};
  }

  get(category) {
    return this.cache[category];
  }

  put(category, level) {
    this.cache[category] = level;
  }
}

/** Formats log entries as plain text strings. */
class PlainTextFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(timestamp, category, level, message, meta) {
    return `${timestamp}:${category}:${level}:${message}${meta || ''}`;
  }
}

/* eslint-disable import/extensions */

/** Factory for creating loggers — auto-detects config from global boot context or explicit args. */
class LoggerFactory {
    static loggerCategoryCache = new LoggerCategoryCache();

    static detectConfig(configArg) {
      let $config = null;
      if (getGlobalRoot('config')) {
        $config = getGlobalRoot('config');
      }
      if (detectBrowser() && window?.config) {
        $config = window.config;
      }
      $config = configArg || $config;
      if ($config) {
        return $config;
      }
      // Fall back to the module-level default (ProfileConfigLoader-backed)
      return config;
    }

    static detectLoggerFactory() {
      let $loggerFactory = null;
      if (!(typeof loggerFactory === 'undefined')) {
        // eslint-disable-next-line no-undef
        $loggerFactory = loggerFactory;
      }
      if (!(typeof global === 'undefined') && global?.boot?.contexts?.root?.loggerFactory) {
        $loggerFactory = global.boot.contexts.root.loggerFactory;
      }
      if (detectBrowser() && window?.loggerFactory) {
        $loggerFactory = window.loggerFactory;
      }
      if (detectBrowser() && window?.boot?.contexts?.root?.loggerFactory) {
        $loggerFactory = window.boot.contexts.root.loggerFactory;
      }
      return $loggerFactory;
    }

    static getFormatter(configArg) {
      let format = 'json';
      const $config = this.detectConfig(configArg);
      if (detectBrowser()) {
        format = 'text';
      }
      if ($config.has('logging.format')) {
        format = $config.get('logging.format');
      }
      const formatter = (format.toLowerCase() === 'text') ? new PlainTextFormatter() : new JSONFormatter();
      return formatter;
    }

    static getLogger(category, configArg, configPath, cache) {
      const loggerFactory = this.detectLoggerFactory();
      if (loggerFactory) {
        return loggerFactory.getLogger(category);
      }
      const $configArg = (typeof category === 'object' ? category : configArg);
      const $category = (typeof category === 'object' ? '' : category);
      return new ConfigurableLogger(LoggerFactory.detectConfig($configArg),
        new ConsoleLogger($category,
          null, null, null,
          LoggerFactory.getFormatter($configArg),
          null),
        $category,
        configPath,
        cache || LoggerFactory.loggerCategoryCache);
    }

    constructor(_config, cache, configPath) {
      this.config = _config || config;
      this.cache = cache  || LoggerFactory.loggerCategoryCache ;
      this.configPath = configPath || ConfigurableLogger.DEFAULT_CONFIG_PATH;
      if (!this.config) {
        throw new Error('config is required');
      }
      if (!this.cache) {
        throw new Error('cache is required');
      }
    }

    getLogger(categoryArg) {
      const category = (typeof categoryArg === 'string') ? categoryArg
        : (categoryArg && categoryArg.qualifier)
          || (categoryArg && categoryArg.name)
          || (categoryArg && categoryArg.constructor && categoryArg.constructor.name);
      return new ConfigurableLogger(this.config,
        new ConsoleLogger(category,
          null, null, null,
          this.getFormatter(),
          null),
        category,
        this.configPath,
        this.cache);
    }

    getFormatter() {
      let format = 'json';
      if (detectBrowser()) {
        format = 'text';
      }
      if (this.config.has('logging.format')) {
        format = this.config.get('logging.format');
      }
      const formatter = (format.toLowerCase() === 'text') ? new PlainTextFormatter() : new JSONFormatter();
      return formatter;
    }
}

export { ConfigurableLogger, ConsoleLogger, DelegatingLogger, JSONFormatter, Logger, LoggerCategoryCache, LoggerFactory, LoggerLevel, PlainTextFormatter };
