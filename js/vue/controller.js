import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const controller = {

    refresh() {
        this.setYear(this.year);
        this.storageLocal.acceptCookies();
        if (this.storageLocal.cookiesAccepted()){
            this.api.synchroniseToLocal(false);
            this.storageLocal.setLocalFromModel();
            if (!window.location.href.includes('?uid=')){
                window.location.href = window.location.origin +'?uid='+this.uid+'&year='+this.year+'&lang='+this.lang+'&theme='+this.theme;
            }
            if (this.theme =='dark'){
                document.body.classList.add("yp-dark");
            }else{
                document.body.classList.remove("yp-dark");
            }
        }
        this.loaded=true;
    },

    initialise() {
        this.storageLocal.setLocalIdentities (this.identities);
        this.storageLocal.setLocalPreferences(this.uid,{0:this.year,1:this.lang,2:(this.theme == 'dark'?1:0),3:this.preferences['3']||null});
        this.storageLocal.setLocalPlanner(this.uid,this.year,this.planner);
        this.refresh();
    },

    setYear (year) {
        this.year = year;
        this.firstWeekdayOfMonth = []
        this.daysInMonth = []
        for (let m = 1; m <= 12; m++) {
            this.firstWeekdayOfMonth.push(DateTime.local(year,m, 1).weekday);
            this.daysInMonth.push(DateTime.local(year,m).daysInMonth);
        }
    },

     navigateToYear(){
        if (!isNaN(parseInt(this.nyear))){
            this.year = parseInt(this.nyear.substr(0,4));
            this.nyear = '';
            window.location.href = window.location.origin +'?uid='+this.uid+'&year='+this.year;
        }
    },

    updateEntry (mindex, day, entry, entryType, entryColour, syncToRemote) {
        this.storageLocal.updateLocalEntry(mindex, day, entry, entryType, entryColour);
        if (syncToRemote) {
            this.api.synchroniseToRemote();
        }
    },

    updateWeekColour (mindex, day, entryColour) {
        let weekday = DateTime.local(this.year, mindex + 1, day).weekday;
        for (let i = 1; i < (7 - weekday + 1) && day + i <= daysInMonth[mindex]; i++) {
            let entry = this.getEntry(mindex, day + i);
            let entryType = this.getEntryType(mindex, day + i);
            let syncToRemote = (i == (7 - weekday) || day + i == this.daysInMonth[mindex]);
            this.updateEntry(mindex, day + i, entry, entryType, entryColour, syncToRemote);
        }
    },

     updateEntryState  (mindex,day){
        this.api.synchroniseToLocal(false);
        this.month = mindex;
        this.day = day;
        this.entry = this.getEntry(mindex,day);
        this.entryType = this.getEntryType(mindex,day);
        this.entryColour = this.getEntryColour(mindex,day);
    },

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
        this.storage.setLocalIdentities(this.identities);
        this.planner = this.storage.getPlanner(uid, this.year);
        this.refresh();
        window.location.href = window.location.origin +'?uid='+this.uid+'&year='+this.year+'&lang='+this.lang+'&theme='+this.theme;
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

    getEntry (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['' + 1] || ''
        } else {
            return ''
        }
    },

    getEntryType (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['' + 0] || ''
        } else {
            return ''
        }
    },

    getEntryColour (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['' + 2] || ''
        } else {
            return ''
        }
    },

    getEntryTypeIcon (mindex, day) {
        if (this.getEntryType(mindex, day) == 1) {
            return '<i class="fas fa-bell"></i>'
        } else if (this.getEntryType(mindex, day) == 2) {
            return '<i class="fas fa-birthday-cake"></i>'
        } else if (this.getEntryType(mindex, day) == 3) {
            return '<i class="fas fa-glass-martini"></i>'
        } else if (this.getEntryType(mindex, day) == 4) {
            return '<i class="fas fa-utensils"></i>'
        } else if (this.getEntryType(mindex, day) == 5) {
            return '<i class="fas fa-graduation-cap"></i>'
        } else if (this.getEntryType(mindex, day) == 6) {
            return '<i class="fas fa-heartbeat"></i>'
        }
        return ''
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

     showProfile () {

    },

     showRegister (){
        this.clearModalAlert();
        this.username = '';
        this.password='';
        this.peek = false;
        $('#registerModal').modal('show');
        $('#signinModal').modal('hide');

    },

     clearError () {
        this.error = '';
    },

    register (username, password, email, mobile){

        this.clearModalAlert();
        if (!this.username) {
            // this.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (!this.password) {
            // this.modalWarning = 'warn.passwordnotprovided'
            this.modalErr('password', 'warn.passwordnotprovided')
        }
        if (this.modalErrorTarget) {
            return;
        }

        this.storageLocal.registerRemoteIdentities();

        this.api.register(this.username, this.password, this.email, this.mobile)

    },

    signin (){
        this.clearModalAlert();
        if (!this.username) {
            // this.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (!this.password) {
            // this.modalWarning = 'warn.passwordnotprovided'
            this.modalErr('password', 'warn.passwordnotprovided')
        }
        if (this.modalErrorTarget) {
            return;
        }

        this.api.signin(this.username, this.password, this.rememberme);
    },

    signout (){
        this.uuid = '';
        this.storageLocal.deleteLocalSession();
        this.signedin = this.storageLocal.signedin();
        this.registered = this.storageLocal.registered();
        this.storageLocal.wipe();
    },

     showSignin (){
        this.clearModalAlert();
        this.username = null;
        this.password = null;
        this.peek = false;
        $('#signinModal').modal('show');
        $('#registerModal').modal('hide');
    },

    showResetPassword (){
        this.clearModalAlert();
        this.username = null;
        $('#signinModal').modal('hide');
        $('#resetPasswordModal').modal('show');
    },

    showRecoverUser (){
        this.clearModalAlert();
        this.username = null;
        $('#signinModal').modal('hide');
        $('#recoverUsernameModal').modal('show');
    },

    showDonate (){
        initPaymentForm();
        $('#payModal').modal('show');
    },

    clearModalAlert (){
        this.modalError = '';
        this.modalErrorTarget = null;
        this.modalWarning = '';
        this.modalSuccess = '';

    },

     peekPass(){
        this.peek = true;
    },

     unpeekPass(){
        this.peek = false;
    },

    peekNewPass (){
        this.peeknp = true;
    },

     unpeekNewPass (){
        this.peeknp = false;
    }
}
