import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const entryMethods = {

    updateEntry (mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false) {
        this.storageLocal.updateLocalEntry(mindex, day, entry, entryType, entryColour, notes, emoji);
        // Wire HLC field tracking for jsmdma sync (SYNC-04)
        const year = this.year;
        const month = String(mindex + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const isoDate = `${year}-${month}-${d}`;
        const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, year);
        if (plannerId && this.syncClient) {
            for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
                this.syncClient.markEdited(plannerId, `days.${isoDate}.${field}`);
            }
        }
        if (syncToRemote) {
            this.api.sync(plannerId);
        }
    },

     updateEntryState  (mindex,day){
        const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year);
        this.api.sync(plannerId);
        this.month = mindex;
        this.day = day;
        this.entry = this.getEntry(mindex,day);
        this.entryType = this.getEntryType(mindex,day);
        this.entryColour = this.getEntryColour(mindex,day);
        this.entryNotes = this.getEntryNotes(mindex,day);
        this.entryEmoji = this.getEntryEmoji(mindex,day);
    },

    getEntry (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['tl'] || ''
        } else {
            return ''
        }
    },

    getEntryType (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['tp'] || ''
        } else {
            return ''
        }
    },

    getEntryColour (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['col'] || ''
        } else {
            return ''
        }
    },

    getEntryNotes (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['notes'] || ''
        } else {
            return ''
        }
    },

    getEntryEmoji (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['emoji'] || ''
        } else {
            return ''
        }
    },

    getEntryTypeIcon (mindex, day) {
        if (this.getEntryType(mindex, day) == 1) {
            return '<i class="ph ph-bell"></i>'
        } else if (this.getEntryType(mindex, day) == 2) {
            return '<i class="ph ph-cake"></i>'
        } else if (this.getEntryType(mindex, day) == 3) {
            return '<i class="ph ph-martini"></i>'
        } else if (this.getEntryType(mindex, day) == 4) {
            return '<i class="ph ph-fork-knife"></i>'
        } else if (this.getEntryType(mindex, day) == 5) {
            return '<i class="ph ph-graduation-cap"></i>'
        } else if (this.getEntryType(mindex, day) == 6) {
            return '<i class="ph ph-heartbeat"></i>'
        }
        return ''
    },
}
