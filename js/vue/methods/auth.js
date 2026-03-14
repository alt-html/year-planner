export const authMethods = {

     showProfile () {

    },

     showRegister (){
        this.clearModalAlert();
        this.username = '';
        this.password='';
        this.peek = false;
        $('#registerModal').modal('show');
        $('#signinModal').modal('hide');

    },

    register (username, password, email, mobile){

        this.clearModalAlert();
        if (!this.username) {
            // this.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (!this.password) {
            // this.modalWarning = 'warn.passwordnotprovided'
            this.modalErr('password', 'warn.passwordnotprovided')
        }
        if (this.modalErrorTarget) {
            return;
        }

        this.storageLocal.registerRemoteIdentities();

        this.api.register(this.username, this.password, this.email, this.mobile)

    },

    signin (){
        this.clearModalAlert();
        if (!this.username) {
            // this.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (!this.password) {
            // this.modalWarning = 'warn.passwordnotprovided'
            this.modalErr('password', 'warn.passwordnotprovided')
        }
        if (this.modalErrorTarget) {
            return;
        }

        this.api.signin(this.username, this.password, this.rememberme);
    },

    signout (){
        this.uuid = '';
        this.storageLocal.deleteLocalSession();
        this.signedin = this.storageLocal.signedin();
        this.registered = this.storageLocal.registered();
        this.storageLocal.wipe();
    },

     showSignin (){
        this.clearModalAlert();
        this.username = null;
        this.password = null;
        this.peek = false;
        $('#signinModal').modal('show');
        $('#registerModal').modal('hide');
    },

    showResetPassword (){
        this.clearModalAlert();
        this.username = null;
        $('#signinModal').modal('hide');
        $('#resetPasswordModal').modal('show');
    },

    showRecoverUser (){
        this.clearModalAlert();
        this.username = null;
        $('#signinModal').modal('hide');
        $('#recoverUsernameModal').modal('show');
    },

    clearModalAlert (){
        this.modalError = '';
        this.modalErrorTarget = null;
        this.modalWarning = '';
        this.modalSuccess = '';

    },

     peekPass(){
        this.peek = true;
    },

     unpeekPass(){
        this.peek = false;
    },

    peekNewPass (){
        this.peeknp = true;
    },

     unpeekNewPass (){
        this.peeknp = false;
    }
}
