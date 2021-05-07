
var synchroniseLocalPlanners = function(data, syncPrefs){

    let localIdentities = getLocalIdentities();
    let remoteIdentities = getRemoteIdentitiesFromData(data);
    for (i = remoteIdentities.length-1; i >= 0;i--){
        let index = _.findIndex(localIdentities, function(id){ return id['0'] == remoteIdentities[i]['0']; })
        if (index < 0){
            localIdentities.unshift(remoteIdentities[i]);
        } else {
            localIdentities[index] = remoteIdentities[i];
        }
    }

    model.identities = localIdentities;

    setLocalIdentities(model.identities);

    let remotePlannerYears = getRemotePlannerYears(data);

    let uids = Object.keys(remotePlannerYears);
    for (p = 0; p < uids.length;p++){
        let uid = uids[p]
        if (syncPrefs) {
            setLocalPreferences(uid,data[uid]);
        } // preferences
        for (y=0; y<  remotePlannerYears[uid].length;y++){
            let year = remotePlannerYears[uid][y];
            if (data[uid+'-'+year] == 0){
                deleteCookie(uid+'-'+year);
                for (var m = 1; m <= 12; m++) {
                    deleteCookie(uid+'-'+year+m);
                }
            }
            if ( data[uid+'-'+year] > parseInt(LZString.decompressFromBase64(getCookie(uid+'-'+year)))||0){
                setCookie(uid+'-'+year,  LZString.compressToBase64(JSON.stringify( data [uid+'-'+year])));
                // set uid-year+1-12
                for (var m = 1; m <= 12; m++) {
                    setCookie(uid+'-'+year+m,  LZString.compressToBase64(JSON.stringify( data[uid+'-'+year+m])));
                }
            }
        }
    }

    model.planner = getPlanner(model.uid,model.year);
    model.entry = getEntry(model.month,model.day);
    model.entryType = getEntryType(model.month,model.day);
    model.entryColour = getEntryColour(model.month,model.day);
}

var getRemoteIdentitiesFromData = function (data){
    return data['0'];
}

var getRemotePlannerYears = function(data){
    let remotePlannerYears = {};
    let keys = Object.keys(data);
    var remoteIdentities =  getRemoteIdentitiesFromData(data);
    if (remoteIdentities){
        for (var i = 0; i < remoteIdentities.length; i++) {
            let uid = remoteIdentities[i][0];
            remotePlannerYears[uid] =
                _.uniq(_.map(_.filter(keys,function(key){ return key.includes(uid+'-');}),function(key) {return key.substr(11,4);}),true);
        }
    }
    return remotePlannerYears;
}

