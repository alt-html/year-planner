export const entryMethods = {

    updateEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false) {
        const year    = this.year;
        const month   = String(mindex + 1).padStart(2, '0');
        const d       = String(day).padStart(2, '0');
        const isoDate = `${year}-${month}-${d}`;
        this.plannerStore.setDay(isoDate, {
            tp: entryType, tl: entry, col: entryColour, notes, emoji,
        });
        this.syncScheduler.markDirty();
    },

    updateEntryState(mindex, day) {
        this.month = mindex;
        this.day   = day;
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = this.days[isoDate] || {};
        this.entry       = d.tl    || '';
        this.entryType   = d.tp    || 0;
        this.entryColour = d.col   || 0;
        this.entryNotes  = d.notes || '';
        this.entryEmoji  = d.emoji || '';
        this.showEntryModal = true;
    },

    getEntry(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.tl || '';
    },

    getEntryType(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.tp || 0;
    },

    getEntryColour(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.col || 0;
    },

    getEntryNotes(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.notes || '';
    },

    getEntryEmoji(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.emoji || '';
    },

    getEntryTypeIcon(mindex, day) {
        const t = this.getEntryType(mindex, day);
        if (t == 1) return '<i class="ph ph-bell"></i>';
        if (t == 2) return '<i class="ph ph-cake"></i>';
        if (t == 3) return '<i class="ph ph-martini"></i>';
        if (t == 4) return '<i class="ph ph-fork-knife"></i>';
        if (t == 5) return '<i class="ph ph-graduation-cap"></i>';
        if (t == 6) return '<i class="ph ph-heartbeat"></i>';
        return '';
    },
}
