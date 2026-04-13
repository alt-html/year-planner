export const railMethods = {

    toggleFlyout(name) {
        if (this.railFlyout === name) {
            this.railFlyout = null;
        } else {
            this.railFlyout = name;
        }
    },

    toggleMarkerMode() {
        if (this.markerActive) {
            this.deactivateMarkerMode();
        } else {
            if (this.emojiActive) this.deactivateEmojiMode();
            this.markerActive = true;
            document.body.classList.add('marker-mode');
            this.railFlyout = 'marker';
        }
    },

    deactivateMarkerMode() {
        this.markerActive = false;
        document.body.classList.remove('marker-mode');
        document.body.classList.remove('marker-dragging');
        if (this.railFlyout === 'marker') this.railFlyout = null;
    },

    selectMarkerColour(colour) {
        this.markerColour = parseInt(colour);
    },

    toggleEmojiMode() {
        if (this.emojiActive) {
            this.deactivateEmojiMode();
        } else {
            if (this.markerActive) this.deactivateMarkerMode();
            this.emojiActive = true;
            document.body.classList.add('emoji-mode');
            this.railFlyout = 'emoji';
        }
    },

    deactivateEmojiMode() {
        this.emojiActive = false;
        document.body.classList.remove('emoji-mode');
        document.body.classList.remove('emoji-dragging');
        if (this.railFlyout === 'emoji') this.railFlyout = null;
    },

    selectEmoji(emoji) {
        this.emojiSelected = emoji;
    },

    selectEmojiTab(tab) {
        if (!this.$el) return;
        this.$el.querySelectorAll('.emoji-tab-btn').forEach(b => b.classList.remove('active'));
        this.$el.querySelectorAll('.emoji-tab-panel').forEach(p => p.classList.remove('active'));
        const btn = this.$el.querySelector(`.emoji-tab-btn[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');
        const panel = this.$el.querySelector(`.emoji-tab-panel[data-panel="${tab}"]`);
        if (panel) panel.classList.add('active');
    },

    toggleNavMenu() {
        if (this.navMenuOpen) {
            this.navMenuOpen = false;
            if (this._closeNavMenu) {
                document.removeEventListener('click', this._closeNavMenu);
                this._closeNavMenu = null;
            }
        } else {
            this.navMenuOpen = true;
            this._closeNavMenu = null;
            setTimeout(() => {
                this._closeNavMenu = (e) => {
                    const btnGroup = this.$el ? this.$el.querySelector('.btn-group') : null;
                    if (btnGroup && !btnGroup.contains(e.target)) {
                        this.navMenuOpen = false;
                        document.removeEventListener('click', this._closeNavMenu);
                        this._closeNavMenu = null;
                    }
                };
                document.addEventListener('click', this._closeNavMenu);
            }, 0);
        }
    },

    closeAuthModal() {
        this.showAuthModal = false;
    },

    closeShareModal() {
        this.showShareModal = false;
    },

    closeEntryModal() {
        this.showEntryModal = false;
    },

    closeDeleteModal() {
        this.showDeleteModal = false;
    },

    applyMarkerToCell(cellEl) {
        if (cellEl === this._markerLastCell) return;
        this._markerLastCell = cellEl;

        const monthCol = cellEl.closest('[class*="col"]');
        if (!monthCol) return;
        const monthsRow = monthCol.parentElement;
        if (!monthsRow) return;
        const cols = monthsRow.querySelectorAll(':scope > [class*="col"]');
        let mindex = -1;
        for (let ci = 0; ci < cols.length; ci++) {
            if (cols[ci] === monthCol) { mindex = ci; break; }
        }
        if (mindex < 0) return;

        const daySpan = cellEl.querySelector('.yp-cell-text');
        if (!daySpan) return;
        const dayText = daySpan.textContent.trim().replace(/\u00a0/g, '');
        const day = parseInt(dayText);
        if (isNaN(day) || day < 1) return;

        const entry = this.getEntry(mindex, day);
        const entryType = this.getEntryType(mindex, day);
        const notes = this.getEntryNotes(mindex, day);
        const emoji = this.getEntryEmoji(mindex, day);
        this.updateEntry(mindex, day, entry, entryType, this.markerColour, notes, emoji, true);
    },

    applyEmojiToCell(cellEl) {
        if (cellEl === this._emojiLastCell) return;
        this._emojiLastCell = cellEl;

        const monthCol = cellEl.closest('[class*="col"]');
        if (!monthCol) return;
        const monthsRow = monthCol.parentElement;
        if (!monthsRow) return;
        const cols = monthsRow.querySelectorAll(':scope > [class*="col"]');
        let mindex = -1;
        for (let ci = 0; ci < cols.length; ci++) {
            if (cols[ci] === monthCol) { mindex = ci; break; }
        }
        if (mindex < 0) return;

        const daySpan = cellEl.querySelector('.yp-cell-text');
        if (!daySpan) return;
        const dayText = daySpan.textContent.trim().replace(/\u00a0/g, '');
        const day = parseInt(dayText);
        if (isNaN(day) || day < 1) return;

        const entry = this.getEntry(mindex, day);
        const entryType = this.getEntryType(mindex, day);
        const colour = this.getEntryColour(mindex, day);
        const notes = this.getEntryNotes(mindex, day);
        this.updateEntry(mindex, day, entry, entryType, colour, notes, this.emojiSelected, true);
    },

    initRailInteractions() {
        const body = document.body;

        // Marker mode — mousedown (capture)
        this._onMarkerMousedown = (e) => {
            if (!this.markerActive) return;
            const cell = e.target.closest('#yp-months .yp-cell');
            if (!cell) return;
            e.preventDefault();
            e.stopPropagation();
            this._markerDragging = true;
            this._markerLastCell = null;
            body.classList.add('marker-dragging');
            this.applyMarkerToCell(cell);
        };
        document.addEventListener('mousedown', this._onMarkerMousedown, true);

        // Marker mode — mousemove
        this._onMarkerMousemove = (e) => {
            if (!this._markerDragging) return;
            let cell = document.elementFromPoint(e.clientX, e.clientY);
            if (cell) cell = cell.closest('#yp-months .yp-cell');
            if (cell) this.applyMarkerToCell(cell);
        };
        document.addEventListener('mousemove', this._onMarkerMousemove);

        // Marker mode — mouseup
        this._onMarkerMouseup = () => {
            if (this._markerDragging) {
                this._markerDragging = false;
                this._markerLastCell = null;
                body.classList.remove('marker-dragging');
            }
        };
        document.addEventListener('mouseup', this._onMarkerMouseup);

        // Marker mode — click intercept (capture)
        this._onMarkerClick = (e) => {
            if (!this.markerActive) return;
            const cell = e.target.closest('#yp-months .yp-cell');
            if (cell) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('click', this._onMarkerClick, true);

        // Emoji mode — mousedown (capture)
        this._onEmojiMousedown = (e) => {
            if (!this.emojiActive) return;
            const cell = e.target.closest('#yp-months .yp-cell');
            if (!cell) return;
            e.preventDefault();
            e.stopPropagation();
            this._emojiDragging = true;
            this._emojiLastCell = null;
            body.classList.add('emoji-dragging');
            this.applyEmojiToCell(cell);
        };
        document.addEventListener('mousedown', this._onEmojiMousedown, true);

        // Emoji mode — mousemove
        this._onEmojiMousemove = (e) => {
            if (!this._emojiDragging) return;
            let cell = document.elementFromPoint(e.clientX, e.clientY);
            if (cell) cell = cell.closest('#yp-months .yp-cell');
            if (cell) this.applyEmojiToCell(cell);
        };
        document.addEventListener('mousemove', this._onEmojiMousemove);

        // Emoji mode — mouseup
        this._onEmojiMouseup = () => {
            if (this._emojiDragging) {
                this._emojiDragging = false;
                this._emojiLastCell = null;
                body.classList.remove('emoji-dragging');
            }
        };
        document.addEventListener('mouseup', this._onEmojiMouseup);

        // Emoji mode — click intercept (capture)
        this._onEmojiClick = (e) => {
            if (!this.emojiActive) return;
            const cell = e.target.closest('#yp-months .yp-cell');
            if (cell) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('click', this._onEmojiClick, true);
    },

    toggleRail() {
        const rail = this.$el ? this.$el.querySelector('#rail') : null;
        if (rail) rail.classList.toggle('open');
        document.body.classList.toggle('rail-open');
        this.railFlyout = null;
    },

    doDarkToggle() {
        const rail = this.$el ? this.$el.querySelector('#rail') : null;
        if (rail && rail.classList.contains('open')) {
            sessionStorage.setItem('rail_open', '1');
        }
        const p = new URLSearchParams(window.location.search);
        const current = p.get('theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        p.set('theme', next);
        window.location.search = p.toString();
    },

    toggleStyleTheme() {
        const current = document.body.getAttribute('data-theme') || 'ink';
        const next = current === 'ink' ? 'crisp' : 'ink';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('style_theme', next);
        // Update theme label if present
        const themeLabel = document.getElementById('themeLabel');
        const navLabel = document.getElementById('navThemeLabel');
        const label = next === 'crisp' ? 'Crisp &amp; Clear' : 'Ink &amp; Paper';
        if (themeLabel) themeLabel.innerHTML = label;
        if (navLabel) navLabel.innerHTML = label;
        // styleCrisp reactive flag for v-show on theme icons
        this.styleCrisp = (next === 'crisp');
    },

    navigateToYear(event) {
        const input = event ? event.target : (this.$el ? this.$el.querySelector('.rail-flyout-input') : null);
        if (!input) return;
        const yr = parseInt(input.value);
        if (!isNaN(yr) && yr > 0 && yr < 10000) {
            const p = new URLSearchParams(window.location.search);
            p.set('year', yr);
            window.location.search = p.toString();
        }
    },
}
