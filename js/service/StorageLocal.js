import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';
import LZString from 'https://cdn.jsdelivr.net/npm/lz-string/libs/lz-string.min.js/+esm';

//  Interface to localStorage-based persistence
export default class StorageLocal {
    constructor(api,model,storage) {
        this.qualifier = '@alt-html/year-planner/StorageLocal'
        this.logger = null;

        this.api = api;
        this.model = model;
        this.storage = storage;
    }
    setLocalIdentities (identities) {
        localStorage.setItem('0', JSON.stringify(identities));
    }
    setLocalPreferences (uid, preferences) {

        this.preferences = preferences;
        this.model.preferences = preferences;
        this.model.lang = preferences['1'];
        this.model.theme = (preferences['2'] == 1 ? 'dark' : 'light');

        localStorage.setItem(uid + '', JSON.stringify(preferences));
    }
    getLocalUid () {
        let localIdentities = this.getLocalIdentities();
        if (localIdentities) {
            return localIdentities[0]['0']
        }
        return null;
    }
    getDefaultLocalIdentity () {
        let localIdentities = this.getLocalIdentities();
        if (localIdentities) {
            return localIdentities[0]['0']
        }
        return null;
    }
    getLocalIdentity (uid) {
        let localIdentities = this.getLocalIdentities();
        if (localIdentities) {
            for (let i = 0; i < localIdentities.length; i++) {
                if (localIdentities[i]['0'] == uid) {
                    return localIdentities[i]
                }
            }
        }
        return null;
    }
    getLocalIdentities () {
        let raw = localStorage.getItem('0');
        return raw ? JSON.parse(raw) : null;
    }
    getLocalPlannerYears () {
        let localPlannerYears = {};
        let keys = Object.keys(localStorage);
        let localIdentities = this.getLocalIdentities();
        if (localIdentities) {
            for (let i = 0; i < localIdentities.length; i++) {
                let uid = localIdentities[i][0];
                localPlannerYears[uid] =
                    [...new Set(keys.filter(function (key) {
                        return key.includes(uid + '-');
                    }).map(function (key) {
                        return key.substr(11, 4);
                    }))];
            }
        }
        return localPlannerYears;
    }
    getDefaultLocalPreferences () {
        let raw = localStorage.getItem(this.getLocalIdentities()[0]['0'] + '');
        return raw ? JSON.parse(raw) : null;
    }
    getLocalPreferences (uid) {
        let raw = localStorage.getItem(uid + '');
        return raw ? JSON.parse(raw) : null;
    }
    getDefaultLocalPlanner () {
        return this.getLocalPlanner(this.getLocalIdentities(), this.model.year)
    }
    getLocalPlanner (uid, year) {
        let planner = []
        for (let m = 1; m <= 12; m++) {
            let raw = localStorage.getItem(uid + '-' + year + m);
            planner.push(raw ? JSON.parse(raw) : null);
        }
        return planner;
    }
    deletePlannerByYear (uid, year) {
        let keys = Object.keys(localStorage);
        let keysToDelete = keys.filter(function (key) {
            return key.includes(uid + '-' + year);
        });

        for (let i = 0; i < keysToDelete.length; i++) {
            localStorage.removeItem(keysToDelete[i])
        }

        //Mark remote planner-year as deleted locally
        let isRemote = this.getLocalIdentities().find(function (id) {
            return id['0'] == uid
        })?.[2] == 1;
        if (isRemote) {
            this.setLocalPlannerLastUpdated(uid, year, 0);
        }

        this.model.year = this.model.cyear;
        window.location.href = window.location.origin + '?uid=' + this.model.uid + '&year=' + this.model.cyear;
        location.reload();
    }
    deleteLocalPlanner (uid) {
        let keys = Object.keys(localStorage);
        let keysToDelete = keys.filter(function (key) {
            return key.includes(uid);
        });

        for (let i = 0; i < keysToDelete.length; i++) {
            localStorage.removeItem(keysToDelete[i])
        }
        this.model.identities = this.model.identities.filter(function (id) {
            return id['0'] != uid
        })
        if (this.model.identities.length == 0) {
            this.model.identities = [{0: Math.floor(DateTime.now().ts / 1000), 1: window.navigator.userAgent, 2: 0, 3: 0}]
        }
        this.setLocalIdentities(this.model.identities);
    }
    setLocalPlanner (uid, year, planner) {
        for (let m = 1; m <= 12; m++) {
            localStorage.setItem(uid + '-' + year + m, JSON.stringify(planner[m - 1]))
        }
    }
    setLocalPlannerLastUpdated (uid, year, lastUpdated) {
        localStorage.setItem(uid + '-' + year, JSON.stringify(lastUpdated))
    }
    importLocalPlannerFromJSON (planner) {
        this.importLocalPlanner(JSON.parse(planner));
    }
    importLocalPlannerFromBase64 (planner) {
        this.importLocalPlanner(JSON.parse(LZString.decompressFromBase64(planner)));
    }
    importLocalPlanner (planner) {
        for (let m = 0; m < 12; m++) {
            for (let d = 0; d < this.model.daysInMonth[m - 1]; d++) {
                if (planner[m]?.['' + d]) {
                    if (this.model.planner[m]?.['' + d]?.['' + 0] == 0) {
                        this.model.planner[m]['' + d]['' + 0] = planner[m]['' + d]['' + 0];
                    }
                    if (planner[m]?.['' + d]?.['' + 1]) {
                        if (this.model.planner[m]?.['' + d]?.['' + 1] && this.model.planner[m]?.['' + d]?.['' + 1] != planner[m]['' + d]['' + 1]) {
                            if (!this.model.planner[m]) {
                                this.model.planner[m] = {}
                            }
                            if (!this.model.planner[m]?.['' + d]) {
                                this.model.planner[m]['' + d] = {}
                            }
                            this.model.planner[m]['' + d]['' + 1] = this.model.planner[m]['' + d]['' + 1] + '\n' + planner[m]['' + d]['' + 1];
                        } else {
                            if (!this.model.planner[m]) {
                                this.model.planner[m] = {}
                            }
                            if (!this.model.planner[m]?.['' + d]) {
                                this.model.planner[m]['' + d] = {}
                            }
                            this.model.planner[m]['' + d]['' + 1] = planner[m]['' + d]['' + 1];
                        }
                    }
                }
            }
        }
        this.setLocalPlanner(this.model.uid, this.model.year, this.model.planner);
        this.setLocalPlannerLastUpdated(this.model.uid, this.model.year, Math.floor(DateTime.now().ts / 1000));
    }
    updateLocalEntry (mindex, day, entry, entryType, entryColour) {
        if (!this.model.planner[mindex]) {
            this.model.planner[mindex] = {};
        }
        if (!this.model.planner[mindex]['' + day]) {
            this.model.planner[mindex]['' + day] = {0: entryType, 1: entry, 2: entryColour};
        }
        this.model.planner[mindex]['' + day]['' + 0] = entryType;
        this.model.planner[mindex]['' + day]['' + 1] = entry;
        this.model.planner[mindex]['' + day]['' + 2] = entryColour;
        this.model.entryColour = entryColour;

        this.model.updated = DateTime.now().ts;
        this.setLocalPlanner(this.model.uid, this.model.year, this.model.planner);
        this.setLocalPlannerLastUpdated(this.model.uid, this.model.year, Math.floor(DateTime.now().ts / 1000));

    }
    setLocalFromModel () {
        this.setLocalIdentities(this.model.identities)
        this.setLocalPreferences(this.model.uid, this.model.preferences)
        this.storage.setPlanner(this.model.uid, this.model.year, this.model.planner);
    }
    extendLocalSession () {
        if (this.signedin() && this.getLocalSession()['1'] > 0) {
            this.setLocalSession(this.model.uuid, DateTime.local().plus({minutes: 30}).ts);
        }
    }
    setLocalSession (uuid, expires) {
        localStorage.setItem('1', JSON.stringify({
            0: uuid,
            1: expires,
            2: this.model.uid,
            3: this.model.year
        }));
    }
    getLocalSession () {
        let raw = localStorage.getItem('1');
        return raw ? JSON.parse(raw) : null;
    }
    expireLocalSession () {
        localStorage.setItem('1', JSON.stringify({0: this.model.uuid, 1: 1}));
    }
    deleteLocalSession () {
        localStorage.removeItem('1');
    }
    reset () {
        localStorage.clear();
        window.location.href = window.location.origin;
    }
    registerRemoteIdentity (uid) {
        let ids = this.getLocalIdentities();
        for (let i = 0; i < ids.length; i++) {
            if (uid == ids[i]['0']) {
                ids[i]['2'] = 1;
            }
        }
        this.model.identities = ids;
        this.setLocalIdentities(ids);
    }
    registerRemoteIdentities () {
        let ids = this.getLocalIdentities();
        for (let i = 0; i < ids.length; i++) {
            ids[i]['2'] = 1;
        }
        this.model.identities = ids;
        this.setLocalIdentities(ids);
    }
    getRemoteIdentities () {
        return this.getLocalIdentities().filter(function (id) {
            return id?.[2] == 1
        });
    }
    wipe () {
        let remoteIdentities = this.getRemoteIdentities();
        for (let i = 0; i < remoteIdentities.length; i++) {
            this.deleteLocalPlanner(remoteIdentities[i]['0']);
        }
        window.location.href = window.location.origin;
    }
    getLocalStorageData () {
        let data = {};
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        return data;
    }
    initialised () {
        return localStorage.getItem('0') !== null;
    }
    signedin (){
        let expires = this.getLocalSession()?.['1'];
        let isSignedIn = (expires != null && (expires > 0 && expires >= DateTime.now().ts) || expires == 0);
        return isSignedIn;
    }
    registered (){
        return (!!this.getLocalSession());
    }
}
