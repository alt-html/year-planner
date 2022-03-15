import _ from 'https://cdn.jsdelivr.net/npm/lodash-es/lodash.min.js';
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';
import LZString from 'https://cdn.jsdelivr.net/npm/lz-string/libs/lz-string.min.js/+esm';

export default class StorageLocal {
    constructor(api,model,cookies,storage) {
        this.api = api;
        this.model = model;
        this.cookies = cookies;
        this.storage = storage;
    }

    setLocalIdentities (identities) {
        this.cookies.setCookie('0', LZString.compressToBase64(JSON.stringify(identities)), 4384);
    }

    setLocalPreferences (uid, preferences) {

        this.preferences = preferences;
        this.model.preferences = preferences;
        this.model.lang = preferences['1'];
        this.model.theme = (preferences['2'] == 1 ? 'dark' : 'light');

        this.cookies.setCookie(uid + '', LZString.compressToBase64(JSON.stringify(preferences)), 4384);
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
        return JSON.parse(LZString.decompressFromBase64(this.cookies.getCookie('0')));
    }

    getLocalPlannerYears () {
        let localPlannerYears = {};
        let cookies = Object.keys(this.cookies.getCookies());
        let localIdentities = this.getLocalIdentities();
        if (localIdentities) {
            for (let i = 0; i < localIdentities.length; i++) {
                let uid = localIdentities[i][0];
                localPlannerYears[uid] =
                    _.uniq(_.map(_.filter(cookies, function (key) {
                        return key.includes(uid + '-');
                    }), function (key) {
                        return key.substr(11, 4);
                    }), true);
            }
        }
        return localPlannerYears;
    }

    getDefaultLocalPreferences () {
        return JSON.parse(LZString.decompressFromBase64(this.cookies.getCookie(this.getLocalIdentities()[0]['0'] + '')));
    }

    getLocalPreferences (uid) {
        return JSON.parse(LZString.decompressFromBase64(this.cookies.getCookie(uid + '')));
    }

    getDefaultLocalPlanner () {
        return this.getLocalPlanner(this.getLocalIdentities(), this.model.year)
    }

    getLocalPlanner (uid, year) {
        let planner = []
        for (let m = 1; m <= 12; m++) {
            planner.push(JSON.parse(LZString.decompressFromBase64(this.cookies.getCookie(uid + '-' + year + m))));
        }
        return planner;
    }

    deletePlannerByYear (uid, year) {
        let localPlannerYears = {};
        let cookies = Object.keys(this.cookies.getCookies());
        let cookiesToDelete = _.filter(cookies, function (key) {
            return key.includes(uid + '-' + year);
        });

        for (let i = 0; i < cookiesToDelete.length; i++) {
            this.cookies.deleteCookie(cookiesToDelete[i])
        }

        //Mark remote planner-year as deleted locally
        let isRemote = _.find(this.getLocalIdentities(), function (id) {
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
        let localPlannerYears = {};
        let cookies = Object.keys(this.cookies.getCookies());
        let cookiesToDelete = _.filter(cookies, function (key) {
            return key.includes(uid);
        });

        for (let i = 0; i < cookiesToDelete.length; i++) {
            this.cookies.deleteCookie(cookiesToDelete[i])
        }
        _.remove(this.model.identities, function (id) {
            return id['0'] == uid
        })
        if (this.model.identities.length == 0) {
            this.model.identities = [{0: Math.floor(DateTime.now().ts / 1000), 1: window.navigator.userAgent, 2: 0, 3: 0}]
        }
        this.setLocalIdentities(this.model.identities);
    }

    setLocalPlanner (uid, year, planner) {
        for (let m = 1; m <= 12; m++) {
            this.cookies.setCookie(uid + '-' + year + m, LZString.compressToBase64(JSON.stringify(planner[m - 1])), 4384)
        }
    }

    setLocalPlannerLastUpdated (uid, year, lastUpdated) {
        this.cookies.setCookie(uid + '-' + year, LZString.compressToBase64(JSON.stringify(lastUpdated)), 4384)
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
        if (this.api.cookiesAccepted()) {
            this.setLocalIdentities(this.model.identities)
            this.setLocalPreferences(this.model.uid, this.model.preferences)
            this.storage.setPlanner(this.model.uid, this.model.year, this.model.planner);
        }
    }

    extendLocalSession () {
        if (this.api.signedin() && this.getLocalSession()['1'] > 0) {
            this.setLocalSession(this.model.uuid, DateTime.local().plus({minutes: 30}).ts);
        }
    }

    setLocalSession (uuid, expires) {
        this.cookies.setCookie('1', LZString.compressToBase64(JSON.stringify({
            0: uuid,
            1: expires,
            2: this.model.uid,
            3: this.model.year
        })), 4384);
    }

    getLocalSession () {
        return JSON.parse(LZString.decompressFromBase64(this.cookies.getCookie('1')));
    }

    expireLocalSession () {
        this.cookies.setCookie('1', LZString.compressToBase64(JSON.stringify({0: this.model.uuid, 1: 1})), 4384);
    }

    deleteLocalSession () {
        this.cookies.deleteCookie('1');
    }

    reset () {
        let cookies = Object.keys(this.cookies.getCookies());
        for (let i = 0; i < cookies.length; i++) {
            deleteCookie('' + cookies[i]);
        }
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
        return _.filter(this.getLocalIdentities(), function (id) {
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
}
