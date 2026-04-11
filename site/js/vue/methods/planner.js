import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const plannerMethods = {

    createPlanner() {
        this.createLocalPlanner();
    },

    createLocalPlanner() {
        // New anonymous planner: userKey stays the same (device UUID)
        // Just create a new year entry
        const userKey = this.plannerStore.getUserKey();
        this.userKey      = userKey;
        this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
        this.refresh();
    },

    deletePlannerByYear(userKey, year) {
        this.plannerStore.deletePlanner(userKey, year);
        window.location.href = window.location.origin + '?uid=' + this.uid +
            '&year=' + this.year + '&lang=' + this.lang + '&theme=' + this.theme;
    },

    showRenamePlanner() {
        this.syncScheduler.markDirty();
        this.rename = true;
        $('#rename').show();
        $('#title').focus();
    },

    renamePlanner() {
        $('#rename').hide();
        this.preferences['3'][''+this.year][this.lang] = this.name;
        this.messages[this.lang]['label']['name_'+this.year] = this.name;
        this.rename = false;
        this.storageLocal.setLocalPreferences(this.uid, this.preferences);
        this.updated = DateTime.now().ts;
        this.syncScheduler.markDirty();
    },

    getPlannerName() {
        const n = this.messages[this.lang]['label']['name_'+this.year];
        return n || null;
    },

    getPlannerNameByUidYear(uid, year) {
        const prefs = this.storageLocal.getLocalPreferences(uid) || {};
        return prefs['3']?.[''+year]?.[this.lang] || null;
    },

    getPlannerYears() {
        return this.plannerStore.getLocalPlannerYears();
    },

    sharePlanner() {
        $('#shareModal').modal('show');
        this.shareUrl = window.location.origin + '?share=' + this.storage.getExportString();
        const copyText = document.getElementById('copyUrl');
        copyText.select();
        copyText.setSelectionRange(0, 99999);
    },

    copyUrl() {
        const copyText = document.getElementById('copyUrl');
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand('copy');
    },
}
