import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const plannerMethods = {

    createPlanner() {
        const userKey = this.plannerStore.getUserKey();
        const uuid = this.plannerStore.createDoc(userKey, this.year, '');
        this.plannerStore.activateDoc(uuid);
        this.activeDocUuid = uuid;
        this.syncScheduler.markDirty();
    },

    selectPlanner(uuid) {
        this.plannerStore.activateDoc(uuid);
        this.activeDocUuid = uuid;
        // Update year/name from the selected planner's meta
        const planners = this.plannerStore.listPlanners();
        const selected = planners.find(p => p.uuid === uuid);
        if (selected?.meta) {
            this.year = selected.meta.year || this.year;
            this.name = selected.meta.name || '';
            this.setYear(this.year);
        }
    },

    deletePlannerByUuid(uuid) {
        this.plannerStore.deletePlanner(uuid);
        // If we just deleted the active planner, try to activate another
        if (this.activeDocUuid === uuid) {
            this.activeDocUuid = null;
            const remaining = this.plannerStore.listPlanners();
            if (remaining.length > 0) {
                this.selectPlanner(remaining[0].uuid);
            }
        }
    },

    takeOwnership(uuid) {
        this.plannerStore.takeOwnership(uuid);
        this.syncScheduler.markDirty();
    },

    showRenamePlanner() {
        this.syncScheduler.markDirty();
        this.rename = true;
        this.renameVisible = true;
        this.$nextTick(() => {
            const titleInput = document.getElementById('title');
            if (titleInput) titleInput.focus();
        });
    },

    renamePlanner() {
        this.renameVisible = false;
        this.preferences['3'][''+this.year][this.lang] = this.name;
        this.messages[this.lang]['label']['name_'+this.year] = this.name;
        this.rename = false;
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
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
        return this.plannerStore.listPlanners();
    },

    sharePlanner() {
        this.showShareModal = true;
        this.shareUrl = window.location.origin + '?share=' + this.storage.getExportString();
        this.$nextTick(() => {
            const copyText = document.getElementById('copyUrl');
            if (copyText) { copyText.select(); copyText.setSelectionRange(0, 99999); }
        });
    },

    copyUrl() {
        const copyText = document.getElementById('copyUrl');
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand('copy');
    },
}
