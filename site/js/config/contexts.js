import { Context, Singleton } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js';

import Api from '../service/Api.js';
import Application from '../Application.js';
import AuthService from '../auth/AuthService.js';
import PlannerStore from '../service/PlannerStore.js';
import Storage from '../service/Storage.js';
import StorageLocal from '../service/StorageLocal.js';
import SyncScheduler from '../service/SyncScheduler.js';
import { messages } from '../vue/i18n/messages.js';
import { model } from '../vue/model.js';
import { i18n } from '../vue/i18n.js';

export default new Context([
    new Singleton(PlannerStore),
    new Singleton(Api),
    new Singleton(Application),
    new Singleton({ Reference: AuthService, name: 'authProvider' }),
    new Singleton(Storage),
    new Singleton(StorageLocal),
    new Singleton(SyncScheduler),

    { name: 'messages', Reference: messages },
    { name: 'model',    Reference: model },
    { name: 'i18n',     Reference: i18n },
]);
