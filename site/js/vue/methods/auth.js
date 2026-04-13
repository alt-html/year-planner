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
        this.storageLocal.wipe();
    },

    clearModalAlert() {
        this.modalError       = '';
        this.modalErrorTarget = null;
        this.modalWarning     = '';
        this.modalSuccess     = '';
    },
}
