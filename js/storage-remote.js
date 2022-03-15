export default class StorageRemote {
    constructor(model,storage,storageLocal,cookies) {
        this.model = model;
        this.storage = storage;
        this.storageLocal = storageLocal;
        this.cookies = cookies;
    }

    synchroniseLocalPlanners (data, syncPrefs) {

        let localIdentities = this.storageLocal.getLocalIdentities();
        let remoteIdentities = this.getRemoteIdentitiesFromData(data);
        for (let i = remoteIdentities.length - 1; i >= 0; i--) {
            let index = _.findIndex(localIdentities, function (id) {
                return id['0'] == remoteIdentities[i]['0'];
            })
            if (index < 0) {
                localIdentities.unshift(remoteIdentities[i]);
            } else {
                localIdentities[index] = remoteIdentities[i];
            }
        }

        this.model.identities = localIdentities;

        this.storageLocal.setLocalIdentities(this.model.identities);

        let remotePlannerYears = this.getRemotePlannerYears(data);

        let uids = Object.keys(remotePlannerYears);
        for (let p = 0; p < uids.length; p++) {
            let uid = uids[p]
            if (syncPrefs) {
                this.storageLocal.setLocalPreferences(uid, data[uid]);
            } // preferences
            for (let y = 0; y < remotePlannerYears[uid].length; y++) {
                let year = remotePlannerYears[uid][y];
                if (data[uid + '-' + year] == 0) {
                    this.cookies.deleteCookie(uid + '-' + year);
                    for (let m = 1; m <= 12; m++) {
                        this.cookies.deleteCookie(uid + '-' + year + m);
                    }
                }
                if (data[uid + '-' + year] > (parseInt(LZString.decompressFromBase64(getCookie(uid + '-' + year))) || 0)) {
                    this.cookies.setCookie(uid + '-' + year, LZString.compressToBase64(JSON.stringify(data [uid + '-' + year])));
                    // set uid-year+1-12
                    for (let m = 1; m <= 12; m++) {
                        this.cookies.setCookie(uid + '-' + year + m, LZString.compressToBase64(JSON.stringify(data[uid + '-' + year + m])));
                    }
                }
            }
        }

        this.model.planner = this.storage.getPlanner(this.model.uid, this.model.year);
        this.model.entry = this.storage.getEntry(this.model.month, this.model.day);
        this.model.entryType = this.storage.getEntryType(this.model.month, this.model.day);
        this.model.entryColour = this.storage.getEntryColour(this.model.month, this.model.day);
    }

    getRemoteIdentitiesFromData (data) {
        return data['0'];
    }

    getRemotePlannerYears (data) {
        let remotePlannerYears = {};
        let keys = Object.keys(data);
        let remoteIdentities = this.getRemoteIdentitiesFromData(data);
        if (remoteIdentities) {
            for (let i = 0; i < remoteIdentities.length; i++) {
                let uid = remoteIdentities[i][0];
                remotePlannerYears[uid] =
                    _.uniq(_.map(_.filter(keys, function (key) {
                        return key.includes(uid + '-');
                    }), function (key) {
                        return key.substr(11, 4);
                    }), true);
            }
        }
        return remotePlannerYears;
    }
}
