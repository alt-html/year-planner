export const authMethods = {

    showSignin() {
        this.clearModalAlert();
        $('#authModal').modal('show');
    },

    async signInWith(provider) {
        this.clearModalAlert();
        try {
            await this.authProvider.signIn(provider);
            $('#authModal').modal('hide');
            this.signedin = true;
            const userKey = this.plannerStore.getUserKey();
            this.userKey       = userKey;
            this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
            this.plannerStore.adoptIfEmpty(userKey, this.year);
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
