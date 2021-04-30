
var initialise = function (){
    setLocalIdentities (model.identities);
    setLocalPreferences(model.uid,{0:year,1:lang});
    setLocalPlanner(model.uid,model.year,model.planner);
    refresh();
}

var setLocalIdentities = function(identities) {
    setCookie('0',LZString.compressToBase64(JSON.stringify(identities)),4384);
}

var setLocalPreferences = function(uid,preferences) {
    model.preferences = preferences;
    setCookie(uid+'',LZString.compressToBase64(JSON.stringify(preferences)),4384);
}

var getLocalUid = function(){
    var localIdentities =  getLocalIdentities();
    if (localIdentities){
        return localIdentities[0]['0']
    }
    return null;
}

var getDefaultLocalIdentity = function(){
    var localIdentities =  getLocalIdentities();
    if (localIdentities){
        return localIdentities[0]['0']
    }
    return null;
}

var getLocalIdentity = function(uid){
    var localIdentities =  getLocalIdentities();
    if (localIdentities){
        for (var i = 0; i < localIdentities.length; i++) {
            if (localIdentities[i]['0']==uid){
                return localIdentities[i]
            }
        }
    }
    return null;
}

var getLocalIdentities = function(){
    return JSON.parse(LZString.decompressFromBase64(getCookie('0')));
}

var getLocalPlannerYears = function(){
    let localPlannerYears = {};
    let cookies = Object.keys(getCookies());
    var localIdentities =  getLocalIdentities();
    if (localIdentities){
        for (var i = 0; i < localIdentities.length; i++) {
            let uid = localIdentities[i][0];
            localPlannerYears[uid] =
                _.uniq(_.map(_.filter(cookies,function(key){ return key.includes(uid+'-');}),function(key) {return key.substr(11,4);}),true);
        }
    }
    return localPlannerYears;
}

var getDefaultLocalPreferences = function() {
    return JSON.parse(LZString.decompressFromBase64(getCookie(getLocalIdentities()[0]['0']+'')));
}

var getLocalPreferences = function(uid) {
    return JSON.parse(LZString.decompressFromBase64(getCookie(uid+'')));
}

var getDefaultLocalPlanner = function() {
    return getLocalPlanner(getLocalIdentities(),model.year)
}

var getLocalPlanner = function(uid, year) {
    var planner = []
    for (var m = 1; m <= 12; m++) {
        planner.push(JSON.parse(LZString.decompressFromBase64(getCookie(uid+'-'+year+m))));
    }
    return planner;
}

var deleteLocalPlannerByYear = function(uid, year){
    let localPlannerYears = {};
    let cookies = Object.keys(getCookies());
    let cookiesToDelete = _.filter(cookies,function(key){ return key.includes(uid+'-'+year);});

    for (var i = 0; i < cookiesToDelete.length; i++) {
        deleteCookie(cookiesToDelete[i])
    }
    model.year = model.cyear;
    window.location.href = window.location.origin +'?uid='+model.uid+'&year='+model.cyear;
    location.reload();
}

var deleteLocalPlanner = function(uid){
    let localPlannerYears = {};
    let cookies = Object.keys(getCookies());
    let cookiesToDelete = _.filter(cookies,function(key){ return key.includes(uid);});

    for (var i = 0; i < cookiesToDelete.length; i++) {
        deleteCookie(cookiesToDelete[i])
    }
    setLocalIdentities(_.remove(getLocalIdentities(), function (id) {return id['0'] == uid}));
}

var setLocalPlanner = function(uid, year, planner) {
    for (var m = 1; m <= 12; m++) {
        setCookie(uid+'-'+year+m,LZString.compressToBase64(JSON.stringify(planner[m-1])),4384)
    }
}

var setLocalPlannerLastUpdated = function(uid, year, lastUpdated) {
    setCookie(uid+'-'+year,LZString.compressToBase64(JSON.stringify(lastUpdated)),4384)
}

var importLocalPlannerFromJSON = function(planner) {
    importLocalPlanner(JSON.parse(planner));
}

var importLocalPlannerFromBase64 = function(planner) {
    importLocalPlanner(JSON.parse(LZString.decompressFromBase64(planner)));
}

var importLocalPlanner = function(planner) {
    for (var m = 0; m < 12; m++) {
        for (var d = 0; d < model.daysInMonth[m-1];d ++){
            if (planner[m][''+d]){
                if (model.planner[m][''+d][''+0] == 0) {
                    model.planner[m][''+d][''+0] = planner[m][''+d][''+0];
                }
                if (planner[m][''+d][''+1]){
                    if (model.planner[m][''+d][''+1] && model.planner[m][''+d][''+1] != planner[m][''+d][''+1] ){
                        model.planner[m][''+d][''+1] = model.planner[m][''+d][''+1]+'\n'+planner[m][''+d][''+1];
                    }else {
                        model.planner[m][''+d][''+1] = planner[m][''+d][''+1];
                    }
                }
            }
        }
    }
    setLocalPlanner(model.uid,model.year,model.planner);
    setLocalPlannerLastUpdated(model.uid,model.year,Math.floor(DateTime.now().ts/1000));
}

var updateLocalEntry = function(mindex,day,entry,entryType,entryColour){
    if (!model.planner[mindex]){
        model.planner[mindex] = {};
    }
    if (!model.planner[mindex][''+day]){
        model.planner[mindex][''+day] = {0:entryType,1:entry,2:entryColour};
    }
    model.planner[mindex][''+day][''+0] = entryType;
    model.planner[mindex][''+day][''+1] = entry;
    model.planner[mindex][''+day][''+2] = entryColour;
    model.entryColour = entryColour;

    model.updated = DateTime.now().ts;
    setLocalPlanner(model.uid,model.year,model.planner);
    setLocalPlannerLastUpdated(model.uid,model.year,Math.floor(DateTime.now().ts/1000));

}


var setLocalFromModel = function (){
    if (cookiesAccepted()){
        setLocalIdentities (model.identities)
        setLocalPreferences(model.uid,model.preferences)
        setPlanner(model.uid,model.year,model.planner);
    }
}

var extendLocalSession = function (){
    setLocalSession(model.uuid,DateTime.local().plus({minutes:30}).ts);
}

var setLocalSession = function (uuid,expires){
    setCookie('1',LZString.compressToBase64(JSON.stringify({0:uuid,1:expires})),4384);
    refresh();
}
var getLocalSession = function (){
    return JSON.parse(LZString.decompressFromBase64(getCookie('1')));
}

var expireLocalSession = function (){
    setCookie('1',LZString.compressToBase64(JSON.stringify({0:model.uuid,1:1})),4384);
    refresh();
}

var deleteLocalSession = function (){
    deleteCookie('1');
    refresh();
}
