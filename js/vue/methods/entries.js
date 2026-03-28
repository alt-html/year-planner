import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const entryMethods = {

    updateEntry (mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false) {
        this.storageLocal.updateLocalEntry(mindex, day, entry, entryType, entryColour, notes, emoji);
        if (syncToRemote) {
            this.api.synchroniseToRemote();
        }
    },

     updateEntryState  (mindex,day){
        this.api.synchroniseToLocal(false);
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

    getEntryNotes (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['' + 3] || ''
        } else {
            return ''
        }
    },

    getEntryEmoji (mindex, day) {
        if (this.planner[mindex] && this.planner[mindex]['' + day]) {
            return this.planner[mindex]['' + day]['' + 4] || ''
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
