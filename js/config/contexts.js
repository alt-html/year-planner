import { LoggerFactory, LoggerCategoryCache, ConfigurableLogger } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@2.0.3/dist/alt-javascript-logger-esm.js'

import Api from '../service/Api.js';
import Application from '../service/Application.js';
import { Cookies } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cookies/dist/alt-javascript-cookies-esm.js';

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

let loggerCategoryCache = new LoggerCategoryCache();
let loggerFactory = new LoggerFactory(config,loggerCategoryCache,ConfigurableLogger.DEFAULT_CONFIG_PATH);

export default [
    Api,
    Application,
    Cookies,
    SquareUp,
    Storage,
    StorageLocal,
    StorageRemote,

    {name:'controller', Reference: controller },
    {name:'feature', Reference: feature },
    {name:'messages', Reference: messages },
    {name:'model', Reference: model },
    {name:'i18n', Reference: i18n },
    {name:'loggerFactory', Reference: loggerFactory },
    {name:'loggerCategoryCache', Reference: loggerCategoryCache },
]
