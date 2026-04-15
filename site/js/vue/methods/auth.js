export const authMethods = {

    showSignin() {
        this.clearModalAlert();
        this.showAuthModal = true;
    },

    async signInWith(provider) {
        this.showAuthModal = false;  // close immediately on click (replaces data-dismiss="modal")
        this.clearModalAlert();
        try {
            await this.authProvider.signIn(provider);
            this.signedin = true;
            this.userKey = this.plannerStore.getUserKey();
            this.syncScheduler.markDirty();
        } catch (err) {
            this.modalError = err.message || 'error.syncfailed';
        }
    },

    signout() {
        this.authProvider.signOut();
        this.uuid     = '';
        this.signedin = false;
        // wipe() removed — planner data must survive sign-out (AUT-03)
    },

    async doUnlinkProvider(provider) {
        try {
            const remaining = await this.authProvider.unlinkProvider(provider);
            this.linkedProviders = remaining;
        } catch (err) {
            if (err.message === 'error.lastProvider') {
                this.modalError = this.$t('label.lastProvider');
            } else {
                this.modalError = err.message || 'error.general';
            }
        }
    },

    async doLinkProvider() {
        const linked = this.linkedProviders || [];
        const available = this.availableProviders || [];
        const unlinked = available.filter(p => !linked.includes(p));
        if (unlinked.length === 0) return;
        // If only one unlinked provider, link it directly; otherwise link the first available
        // (future: show a picker if multiple unlinked providers exist)
        const provider = unlinked[0];
        try {
            await this.authProvider.linkProvider(provider);
            // linkProvider redirects — execution does not continue past this point
        } catch (err) {
            this.modalError = err.message || 'error.general';
        }
    },

    clearModalAlert() {
        this.modalError       = '';
        this.modalErrorTarget = null;
        this.modalWarning     = '';
        this.modalSuccess     = '';
    },
}
