
var initialise = function (){
    setLocalIdentities (model.identities);
    setLocalPreferences(model.uid,{0:lang});
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

var getLocalIdentity = function(){
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

var getLocalPreferences = function() {
    return JSON.parse(LZString.decompressFromBase64(getCookie(getLocalIdentities()[0]['0']+'')));
}

var getLocalPreferences = function(uid) {
    return JSON.parse(LZString.decompressFromBase64(getCookie(uid+'')));
}

var getLocalPlanner = function() {
    return getLocalPlanner(getLocalIdentities(),model.year)
}

var getLocalPlanner = function(uid, year) {
    var planner = []
    for (var m = 1; m <= 12; m++) {
        planner.push(JSON.parse(LZString.decompressFromBase64(getCookie(uid+'-'+year+m))));
    }
    return planner;
}

var deleteLocalPlanner = function(uid, year){
    let localPlannerYears = {};
    let cookies = Object.keys(getCookies());
    let cookiesToDelete = _.filter(cookies,function(key){ return key.includes(uid+'-'+year);});

    for (var i = 0; i < cookiesToDelete.length; i++) {
        deleteCookie(cookiesToDelete[i])
    }
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

var updateEntry = function(mindex,day,entry,entryType,entryColour){
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
}

var updateWeekColour = function(mindex,day,entryColour){
    var weekday = DateTime.local(model.year,mindex+1, day).weekday;
    for (i=1; i < (7-weekday+1) && day+i <= model.daysInMonth[mindex] ;i++){
        var entry = getEntry(mindex,day+i);
        updateEntry(mindex,day+i,entry[1],entry[0],entryColour);
    }
}

var updateMonthColour = function(mindex,day,entryColour){

    for (i=day+1; i <= model.daysInMonth[mindex];i++ ){
        var entry = getEntry(mindex,i);
        updateEntry(mindex,i,entry[1],entry[0],entryColour);
    }
}


var getEntry = function(mindex,day){
    if (model.planner[mindex] && model.planner[mindex][''+day]){
        return model.planner[mindex][''+day][''+1] || ''
    } else {
        return ''
    }
}

var getEntryType = function(mindex,day){
    if (model.planner[mindex] && model.planner[mindex][''+day]){
        return model.planner[mindex][''+day][''+0] || ''
    } else {
        return ''
    }
}

var getEntryColour = function(mindex,day){
    if (model.planner[mindex] && model.planner[mindex][''+day]){
        return model.planner[mindex][''+day][''+2] || ''
    } else {
        return ''
    }
}

var getEntryTypeIcon = function(mindex,day){
    if (getEntryType(mindex,day)==1){
        return '<i class="fas fa-bell"></i>'
    } else if (getEntryType(mindex,day)==2) {
        return '<i class="fas fa-birthday-cake"></i>'
    } else if (getEntryType(mindex,day)==3) {
        return '<i class="fas fa-glass-martini"></i>'
    } else if (getEntryType(mindex,day)==4) {
        return '<i class="fas fa-utensils"></i>'
    } else if (getEntryType(mindex,day)==5) {
        return '<i class="fas fa-graduation-cap"></i>'
    } else if (getEntryType(mindex,day)==6) {
    return '<i class="fas fa-heartbeat"></i>'
}
    return ''
}


var getExportString = function (){
    var exporter = [];
    exporter.push (getLocalIdentity(model.uid));
    exporter.push (model.preferences);
    exporter.push (model.year);
    exporter.push (model.planner);
    return LZString.compressToEncodedURIComponent(JSON.stringify(exporter));
}

var setModelFromImportString = function (importUrlParam){
    if (''!= importUrlParam){
        var importer = JSON.parse(LZString.decompressFromEncodedURIComponent(importUrlParam));
        model.uid = importer[0]['0'];
        if (!getLocalIdentity(model.uid)){
            model.identities.push(importer[0]);
        }
        model.preferences = importer[1]
        model.year = importer[2];
        model.planner = importer[3];
        model.lang = model.preferences['0'];
    }
}

var setLocalFromModel = function (){
    if (cookiesAccepted()){
        setLocalIdentities (model.identities)
        setLocalPreferences(model.uid,model.preferences)
        setLocalPlanner(model.uid,model.year,model.planner);
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