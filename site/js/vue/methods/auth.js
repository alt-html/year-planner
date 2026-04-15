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

    clearModalAlert() {
        this.modalError       = '';
        this.modalErrorTarget = null;
        this.modalWarning     = '';
        this.modalSuccess     = '';
    },
}
