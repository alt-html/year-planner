
var initialise = function (){
    setLocalIdentities (model.identities);
    setLocalPreferences(model.uid,{0:year,1:lang});
    setLocalPlanner(model.uid,model.year,model.planner);
    refresh();
}

var getPlannerYears = function() {
    return getLocalPlannerYears();
}

var getPlanner = function (uid,year){
    //if signed in get remote planner otherwise local
    return getLocalPlanner(uid, year);
}

var exportPlannerToJSON = function() {
    return JSON.stringify(model.planner);
}

var exportPlannerToBase64 = function() {
        return LZString.compressToBase64(exportPlannerToJSON());
}

var setPlanner = function (uid, year, planner){
    setLocalPlanner(uid, year, planner);
}

var updateEntry = function(mindex,day,entry,entryType,entryColour) {
    updateLocalEntry(mindex,day,entry,entryType,entryColour);
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


function download(filename, contentType,text) {
    var element = document.createElement('a');
    element.setAttribute('href','data:'+contentType+';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}