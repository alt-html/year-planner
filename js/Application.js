import { urlParam } from './util/urlparam.js';
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';
import { getNavigatorLanguage } from "./vue/i18n/i18n.js";

export default class Application {

    constructor(api, model, storage, storageLocal, messages) {
        this.qualifier = '@alt-html/year-planner/Application'
        this.logger = null;

        this.pageLoadTime = DateTime.now();
        this.url = {
            parameters : {
                uid : urlParam('uid'),
                year : urlParam('year'),
                lang : urlParam('lang'),
                theme : urlParam('theme'),
                name : urlParam('name'),
                share : urlParam('share'),
                verify : urlParam('share')
            }
        }
        this.api = api;
        this.model = model;
        this.storage = storage;
        this.storageLocal = storageLocal;
        this.messages = messages;
    }

    init(){

        this.model.uid = parseInt( urlParam('uid') ) || this.storageLocal.getLocalUid() || Math.floor(this.pageLoadTime.ts/1000);
        this.model.uuid = this.storageLocal.getLocalSession()?.['0']||'',
        this.model.pageLoadTime = this.pageLoadTime;
        this.model.identities = this.storageLocal.getLocalIdentities() || [{0:this.model.uid,1:window.navigator.userAgent,2:0,3:0}],

        this.model.preferences = (this.storageLocal.getLocalPreferences(this.model.uid) || {});

        this.model.year = parseInt( this.url.parameters.year ) || this.model.preferences['0'] || this.pageLoadTime.year;
        this.model.lang = (this.url.parameters.lang || this.model.preferences['1'] || getNavigatorLanguage() ).substring(0,2);
        this.model.theme = this.url.parameters.theme || (this.model.preferences['2'] == 1 ? 'dark' : 'light');
        this.model.name = this.url.parameters.name || (this.model.preferences['3']?.[''+this.model.year]?.[this.model.lang]) || '';
        this.model.share = this.url.parameters.share || '';

        this.model.preferences['0'] = this.model.year;
        this.model.preferences['1'] = this.model.lang;
        this.model.preferences['2'] = (this.model.theme == 'light' ? 0:1);
        if (!this.model.preferences['3']){
            this.model.preferences['3'] = {};
        }
        if (!this.model.preferences['3'][''+this.model.year]){
            this.model.preferences['3'][''+this.model.year] = {}
        }

        this.model.preferences['3'][''+this.model.year][this.model.lang]=this.model.name;
        this.model.updated = this.pageLoadTime.ts,
        this.model.cyear  = this.pageLoadTime.year,
        this.model.cmonth  = this.pageLoadTime.month,
        this.model.cday = this.pageLoadTime.day,

        this.model.registered = this.storageLocal.registered(),
        this.model.signedin = this.storageLocal.signedin(),
        this.model.planner = this.storage.getPlanner(this.model.uid, this.model.year),

        this.storage.setModelFromImportString(this.model.share);
        this.api.verifyEmailToken(this.url.parameters.verify, this.model);

        this.messages[this.model.lang]['label']['name_'+this.model.year] = this.model.name;
    }
}
