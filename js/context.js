import { LoggerFactory, LoggerCategoryCache, ConfigurableLogger } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@2.0.3/dist/alt-javascript-logger-esm.js'
import { Cookies } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cookies/dist/alt-javascript-cookies-esm.js';


import Api from './Api.js';
import { methods } from './methods.js';
import config from './config.js';
import Controller from './Controller.js';
import SquareUp  from './SquareUp.js';
import Storage  from './Storage.js';
import StorageLocal  from './storage-local.js';
import StorageRemote  from './storage-remote.js';
import { feature } from './features.js';
import { messages } from './i18n.js';
import { model } from './model.js';

const context = {};

//Construct
context.api = new Api();
context.config = config;
context.controller = new Controller();
context.cookies = new Cookies();
context.feature = feature;
context.loggerCategoryCache = new LoggerCategoryCache();
context.loggerFactory = new LoggerFactory(context.config,context.loggerCategoryCache,ConfigurableLogger.DEFAULT_CONFIG_PATH);
context.messages = messages;
context.methods = methods;
context.model = model;
context.squareUp = new SquareUp();
context.storage = new Storage();
context.storageLocal = new StorageLocal();
context.storageRemote = new StorageRemote();

// Inject Dependencies
context.api.model = context.model;
context.api.storageLocal = context.storageLocal;

context.controller.api = context.api;
context.controller.messages = context.messages;
context.controller.model = context.model;
context.controller.storage = context.storage;
context.controller.storageLocal = context.storageLocal;

context.cookies.logger = context.loggerFactory.getLogger(context.cookies);
context.model.api = context.api;
context.model.messages = context.messages;
context.model.storage = context.storage;
context.model.storageLocal = context.storageLocal;

context.squareUp.model = context.squareUp;
context.squareUp.logger = context.loggerFactory.getLogger(context.squareUp);

context.storage.api = context.api;
context.storage.model = context.model;
context.storage.storageLocal = context.storageLocal;

context.storageLocal.api = context.api;
context.storageLocal.model = context.model;
context.storageLocal.cookies = context.cookies;
context.storageLocal.storage = context.storage;

context.storageRemote.model = context.model;
context.storageRemote.storage = context.storage;
context.storageRemote.storageLocal = context.storageLocal;
context.storageRemote.cookies = context.cookies;

//Post Construct
context.controller.init()

export { context }
