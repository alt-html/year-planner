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
var lang = ($.urlParam('lang') || getNavigatorLanguage() ).substring(0,2);

var uid = parseInt( $.urlParam('uid') ) || getLocalUid() || Math.floor(pageLoadTime.ts/1000);
var year = parseInt( $.urlParam('year') )|| pageLoadTime.year;
var share = $.urlParam('share') || '';
var theme = $.urlParam('theme') || 'light';
var preferences = (getLocalPreferences() || {})
preferences['0'] = lang;

var model = {
    DateTime : DateTime,
    pageLoadTime : pageLoadTime,
    lang: lang,
    uid : uid,
    identities: getLocalIdentities() || [{0:uid,1:window.navigator.userAgent}],
    year: year,
    share : share,
    theme : theme,
    month : 0,
    day : 1,
    entry: '',
    entryType : 0,
    preferences: preferences,
    planner: getLocalPlanner(uid, year),
    shareUrl: window.location.origin,
    daysOfWeek : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    monthsOfYear : ['January','February','March','April','May','June','July','August','September','October','November','December'],
    firstWeekdayOfMonth : [],
    daysInMonth : [],
    error : '',
    updated: DateTime.now().ts
}

setModelFromImportString(share);

var refresh = function() {
    setYear(model.year);
    setLocalPreferences(model.uid,model.preferences)
    acceptCookies();
    if (!window.location.href.includes('?uid=')){
        window.location.href = window.location.origin +'?uid='+model.uid+'&year='+model.year+'&lang='+model.lang+'&theme='+model.theme;
    }
    if (model.theme =='dark'){
        document.body.classList.add("yp-dark");
    }else{
        document.body.classList.length = 0;
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

var updateEntryState = function (mindex,day){
    model.month = mindex;
    model.day = day;
    model.entry = getEntry(mindex,day);
    model.entryType = getEntryType(mindex,day)
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

const i18n = new VueI18n({
    locale: ($.urlParam('lang') || 'en').substring(0,2), // set locale
    fallbackLocale: 'en',
    messages, // set locale messages
})

var app = new Vue({
    i18n,
    el: '#app',
    data: model,
    methods: {
        refresh: function (event) {
            refresh();
        }
    }//,
    // components: {
    //     jobTreeComponent
    // }
})

app.refresh();

document.title = app.$t('label.yearplanner');
document.documentElement.lang = model.lang;

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})













