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
            this.api.synchroniseToLocal(true);
        } catch (err) {
            this.modalError = err.message || 'error.syncfailed';
        }
    },

    signout() {
        this.authProvider.signOut();
        this.uuid = '';
        this.signedin = false;
        this.storageLocal.wipe();
    },

    clearModalAlert() {
        this.modalError = '';
        this.modalErrorTarget = null;
        this.modalWarning = '';
        this.modalSuccess = '';
    },
}
