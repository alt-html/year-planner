/*

var string = "This is my compression test.";
alert("Size of sample is: " + string.length);
var compressed = LZString.compressToBase64(string);
alert("Size of compressed sample is: " + compressed.length);
string = LZString.decompressFromBase64(compressed);
alert("Sample is: " + string);

var string = "This is my compression test.";
alert("Size of sample is: " + string.length);
var compressed = LZString.compressToBase64ToEncodedURIComponent(string);
alert("Size of compressed sample is: " + compressed.length);
string = LZString.decompressFromBase64FromEncodedURIComponent(compressed);
alert("Sample is: " + string);
 */

var initialise = function (){
    setLocalIdentities (model.identities);
    setLocalPreferences(model.uid,{0:lang});
    setLocalPlanner(model.uid,model.year,model.planner);
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
        for (var i = 0; i <= localIdentities.length; i++) {
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

var setLocalPlanner = function(uid, year, planner) {
    for (var m = 1; m <= 12; m++) {
        setCookie(uid+'-'+year+m,LZString.compressToBase64(JSON.stringify(planner[m-1])),4384)
    }
}

var updateEntry = function(mindex,day,entry,entryType){
    if (!model.planner[mindex]){
       model.planner[mindex] = {};
    }
    if (!model.planner[mindex][''+day]){
        model.planner[mindex][''+day] = {0:entryType,1:entry,2:Math.floor(DateTime.now().ts/1000)};
    }
    model.planner[mindex][''+day][''+0] = entryType;
    model.planner[mindex][''+day][''+1] = entry;
    model.updated = DateTime.now().ts;
    setLocalPlanner(model.uid,model.year,model.planner);

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
        if (!getLocalIdentity(uid)){
            model.identities.push(importer[0]);
        }
        model.preferences = importer[1]
        model.year = importer[2];
        model.planner = importer[3];
        model.lang = model.preferences['0'];
    }
}

var setLocalFromModel = function (){
        setLocalIdentities (model.identities)
        setLocalPreferences(model.uid,model.preferences)
        setLocalPlanner(model.uid,model.year,model.planner);
}