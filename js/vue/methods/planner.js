import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const plannerMethods = {

     createPlanner (){
        this.api.synchroniseToLocal(false);
        this.createLocalPlanner();
        this.api.synchroniseToRemote();
    },

    createLocalPlanner(){
        let uid =  Math.floor(DateTime.now().ts/1000);
        let preferences = {};

        preferences['0'] = this.year;
        preferences['1'] = this.lang;
        preferences['2'] = (this.theme == 'light' ? 0:1);

        this.uid = uid;
        this.preferences = preferences;
        this.identities.unshift({0:uid,1:window.navigator.userAgent,2:this.storageLocal.signedin()?1:0,3:0});
        this.storageLocal.setLocalIdentities(this.identities);
        this.planner = this.storage.getPlanner(uid, this.year);
        this.refresh();
        window.location.href = window.location.origin +'?uid='+this.uid+'&year='+this.year+'&lang='+this.lang+'&theme='+this.theme;
    },

    deletePlannerByYear(uid, year) {
        // Delete all data for this planner (identity + all year data)
        this.storageLocal.deleteLocalPlanner(uid);
        // Navigate to the first remaining planner, or reload if none
        const remaining = this.identities.find(id => id['0'] != uid);
        if (remaining) {
            window.location.href = window.location.origin + '?uid=' + remaining['0'] + '&year=' + this.year + '&lang=' + this.lang + '&theme=' + this.theme;
        } else {
            window.location.reload();
        }
    },

     showRenamePlanner() {
        this.api.synchroniseToLocal(false);
        this.rename=true;
        $('#rename').show();
        $('#title').focus();
    },

     renamePlanner() {
        $('#rename').hide();
        this.preferences['3'][''+this.year][this.lang]=this.name;
        this.messages[this.lang]['label']['name_'+this.year] = this.name;
        this.rename=false;
        this.storageLocal.setLocalPreferences(this.uid,this.preferences);
        this.updated = DateTime.now().ts;
        this.api.synchroniseToRemote();
    },

     getPlannerName() {
        let n = this.messages[this.lang]['label']['name_'+this.year];
        if (n) {
            return n;
        }
        return null;
    },

    getPlannerNameByUidYear (uid,year){
        let prefs = this.storageLocal.getLocalPreferences(uid) || {};
        return prefs['3']?.[''+year]?.[this.lang] || null;
    },

    getPlannerYears (){
        return this.storageLocal.getLocalPlannerYears();
    },

     sharePlanner(){
        $('#shareModal').modal('show');
        this.shareUrl = window.location.origin+'?share='+this.storage.getExportString();
        let copyText = document.getElementById("copyUrl");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
    },

     copyUrl (){
        let copyText = document.getElementById("copyUrl");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy")
    },
}
