import { LoggerFactory, LoggerCategoryCache, ConfigurableLogger } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@2/dist/alt-javascript-logger-esm.js'
import { Cookies } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cookies/dist/alt-javascript-cookies-esm.js';

import Api from '../service/Api.js';
import Application from '../service/Application.js';
import { controller } from '../vue/controller.js';
import config from '../config/config.js';
import SquareUp  from '../service/SquareUp.js';
import Storage  from '../service/Storage.js';
import StorageLocal  from '../service/StorageLocal.js';
import StorageRemote  from '../service/StorageRemote.js';
import { feature } from '../vue/model-features.js';
import { messages } from '../vue/i18n/messages.js';
import { model } from '../vue/model.js';

import { i18n } from '../vue/i18n.js';

const context = {};

//Construct
context.api = new Api();
context.config = config;
context.application = new Application();
context.controller = controller;
context.cookies = new Cookies();
context.feature = feature;
context.i18n = i18n;
context.loggerCategoryCache = new LoggerCategoryCache();
context.loggerFactory = new LoggerFactory(context.config,context.loggerCategoryCache,ConfigurableLogger.DEFAULT_CONFIG_PATH);
context.messages = messages;
context.model = model;
context.squareUp = new SquareUp();
context.storage = new Storage();
context.storageLocal = new StorageLocal();
context.storageRemote = new StorageRemote();

// Inject Dependencies
context.api.logger = context.loggerFactory.getLogger(context.api);
context.api.model = context.model;
context.api.storageLocal = context.storageLocal;
context.api.i18N = context.i18n;

context.application.logger = context.loggerFactory.getLogger(context.application);
context.application.api = context.api;
context.application.messages = context.messages;
context.application.model = context.model;
context.application.storage = context.storage;
context.application.storageLocal = context.storageLocal;

context.cookies.logger = context.loggerFactory.getLogger(context.cookies);
context.model.api = context.api;
context.model.messages = context.messages;
context.model.storage = context.storage;
context.model.storageLocal = context.storageLocal;

context.squareUp.logger = context.loggerFactory.getLogger(context.squareUp);
context.squareUp.model = context.squareUp;
context.squareUp.i18n = context.i18n;

context.storage.logger = context.loggerFactory.getLogger(context.storage);
context.storage.api = context.api;
context.storage.model = context.model;
context.storage.storageLocal = context.storageLocal;

context.storageLocal.logger = context.loggerFactory.getLogger(context.storageLocal);
context.storageLocal.api = context.api;
context.storageLocal.model = context.model;
context.storageLocal.cookies = context.cookies;
context.storageLocal.storage = context.storage;

context.storageRemote.logger = context.loggerFactory.getLogger(context.storageRemote);
context.storageRemote.model = context.model;
context.storageRemote.storage = context.storage;
context.storageRemote.storageLocal = context.storageLocal;
context.storageRemote.cookies = context.cookies;

//Post Construct
context.application.init()

export { context }
