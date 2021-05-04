window.request = superagent;

$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
        .exec(window.location.href);
    if (results == null) {
        return 0;
    }
    return results[1] || 0;
}

var DateTime = luxon.DateTime;
var pageLoadTime = DateTime.now();

var uid = parseInt( $.urlParam('uid') ) || getLocalUid() || Math.floor(pageLoadTime.ts/1000);
var preferences = (getLocalPreferences(uid) || {})


var year = parseInt( $.urlParam('year') ) || preferences['0'] || pageLoadTime.year;
var lang = ($.urlParam('lang') || preferences['1'] || getNavigatorLanguage() ).substring(0,2);
var theme = $.urlParam('theme') || (preferences['2'] == 1 ? 'dark' : 'light');
var name = $.urlParam('name') || (preferences['3']?.[''+year]?.[lang]) || '';

var share = $.urlParam('share') || '';

preferences['0'] = year;
preferences['1'] = lang;
preferences['2'] = (theme == 'light' ? 0:1);
if (!preferences['3']){
    preferences['3'] = {};
}
if (!preferences['3'][''+year]){
    preferences['3'][''+year] = {}
}
preferences['3'][''+year][lang]=name;
messages[lang]['label']['name_'+year] = name;

var model = {
    DateTime : DateTime,
    pageLoadTime : pageLoadTime,
    lang: lang,
    uid : uid,
    year: year,
    nyear : null,
    theme : theme,
    share : share,
    name : name,
    rename : false,

    uuid : '',
    username : '',
    email : '',
    emailverified : 0,
    mobile : '',
    mobileverified : 0,
    password: '',
    donation : -1,
    rememberme : false,

    identities: getLocalIdentities() || [{0:uid,1:window.navigator.userAgent,2:0,3:0}],
    preferences: preferences,
    planner: getPlanner(uid, year),

    month : 0,
    day : 1,
    entry: '',
    entryType : 0,
    entryColour : 0,
    shareUrl: window.location.origin,
    daysOfWeek : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    monthsOfYear : ['January','February','March','April','May','June','July','August','September','October','November','December'],
    firstWeekdayOfMonth : [],
    daysInMonth : [],
    error : '',
    updated: DateTime.now().ts,
    cyear : pageLoadTime.year,
    cmonth : pageLoadTime.month,
    cday: pageLoadTime.day,

    feature : feature,
    error : '',
    warning : '',
    modalError : '',
    modalErrorTarget : null,
    modalWarning : ''
}

setModelFromImportString(share);

var refresh = function() {
    setYear(model.year);
    acceptCookies();
    if (cookiesAccepted()){
        setLocalFromModel();
        if (!window.location.href.includes('?uid=')){
            window.location.href = window.location.origin +'?uid='+model.uid+'&year='+model.year+'&lang='+model.lang+'&theme='+model.theme;
        }
        if (model.theme =='dark'){
            document.body.classList.add("yp-dark");
        }else{
            document.body.classList.length = 0;
        }
    }
}

var  setYear = function (year) {
    model.year = year;
    model.firstWeekdayOfMonth = []
    model.daysInMonth = []
    for (var m = 1; m <= 12; m++) {
        model.firstWeekdayOfMonth.push(DateTime.local(year,m, 1).weekday);
        model.daysInMonth.push(DateTime.local(year,m).daysInMonth);
    }
}

var navigateToYear = function(){
    if (!isNaN(parseInt(model.nyear))){
        model.year = parseInt(model.nyear.substr(0,4));
        model.nyear = '';
        window.location.href = window.location.origin +'?uid='+model.uid+'&year='+model.year;
    }
}

var updateEntryState = function (mindex,day){
    model.month = mindex;
    model.day = day;
    model.entry = getEntry(mindex,day);
    model.entryType = getEntryType(mindex,day);
    model.entryColour = getEntryColour(mindex,day);
}

var createPlanner = function (){
    createLocalPlanner();
}

var createLocalPlanner = function(){
    uid =  Math.floor(DateTime.now().ts/1000);
    preferences = {};

    preferences['0'] = year;
    preferences['1'] = lang;
    preferences['2'] = (theme == 'light' ? 0:1);

    model.uid = uid;
    model.preferences = preferences;
    model.identities.unshift({0:uid,1:window.navigator.userAgent,2:signedin()?1:0,3:0});
    setLocalIdentities(model.identities);
    model.planner = getPlanner(uid, year);
    refresh();
    window.location.href = window.location.origin +'?uid='+model.uid+'&year='+model.year+'&lang='+model.lang+'&theme='+model.theme;
}

var showRenamePlanner = function() {
    model.rename=true;
     $('#rename').show();
     $('#title').focus();
}

var renamePlanner = function() {
    $('#rename').hide();
    preferences['3'][''+year][lang]=model.name;
    messages[lang]['label']['name_'+year] = model.name;
    model.rename=false;
    setLocalPreferences(model.uid,model.preferences);
    model.updated = DateTime.now().ts;
}

var getPlannerName = function() {
    let n = messages[lang]['label']['name_'+year];
    if (n) {
        return n;
    }
    return null;
}

var getPlannerNameByUidYear = function (uid,year){
    let prefs = getLocalPreferences(uid) || {};
    return prefs['3']?.[''+year]?.[lang] || null;
}

var sharePlanner = function(){
    model.shareUrl = window.location.origin+'?share='+getExportString();
    var copyText = document.getElementById("copyUrl");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
}

var copyUrl = function (){
    var copyText = document.getElementById("copyUrl");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy")
}




var showSettings = function () {

}

var saveSettings = function () {

}

var showRegister = function (){
    clearModalAlert();
    model.username = '';
    model.password='';
}

var showSignin = function (){
    clearModalAlert();
    model.username = null;
    model.password = null;
    $('#signinModal').modal('show');
    refresh();
}

var modalErr = function (target,err) {
    if (!model.modalErrorTarget){
        model.modalErrorTarget = {};
    }
    model.modalErrorTarget[target] =  err;
}

var clearModalAlert = function (){
 model.modalError = '';
 model.modalErrorTarget = null;
 model.modalWarning = '';

}

const i18n = new VueI18n({
    locale: ($.urlParam('lang') || 'en').substring(0,2), // set locale
    fallbackLocale: 'en',
    messages, // set locale messages
})

var app = new Vue({
    i18n : i18n,
    el: '#app',
    data: model,
    methods: {
        refresh: function (event) {
            refresh();
        }
    },
})

app.refresh();

document.title = app.$t('label.yearplanner');
document.documentElement.lang = model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













