import config from './config/config.js';
import contexts  from './config/contexts.js';
import { ApplicationContext } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi/dist/alt-javascript-cdi-esm.js';

let applicationContext = new ApplicationContext({contexts, config});
await applicationContext.start();

window.applicationContext = applicationContext;













