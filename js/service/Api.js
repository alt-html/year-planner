import { model } from "/js/vue/model.js";
import { i18n } from "/js/vue/i18n/i18n.js";

//  Client SDK to server side API
export default class Api {
    constructor(model, storageLocal, cookies) {
        this.qualifier = '@alt-html/year-planner/Api'
        this.logger = null;

        this.model = model;
        this.storageLocal = storageLocal;
    }
    synchroniseToRemote (){
        if (this.storageLocal.signedin()) {

            this.storageLocal.registerRemoteIdentity(this.model.uid);

            request
                .post('/api/planner/' + this.storageLocal.getLocalSession()?.['0'])
                .send({})
                .then(response => {
                    this.storageLocal.extendLocalSession();
                    }
                )
                .catch(err => {
                    if (err.status == 404)
                        this.model.error = 'error.apinotavailable';
                    if (err.status == 401)
                        this.model.error = 'error.unauthorized';
                }) //401 - unauthorised, 200 success returns uuid and subscription
        }
    }
    synchroniseToLocal (syncPrefs){
        if (this.storageLocal.signedin()) {
            request
                .get('/api/planner/' + this.storageLocal.getLocalSession()?.['0'])
                .set('Accept', 'application/json')
                .then(response => {
                        this.model.response = response;
                        this.model.uuid = response.body.uuid;
                        this.model.username = response.body.username;
                        this.model.donation = response.body.donation;
                        this.model.email = response.body.email;
                        this.model.emailverified = response.body.emailverified;
                        this.model.mobile = response.body.mobile;
                        this.model.mobileverified = response.body.mobileverified;
                        this.storageLocal.extendLocalSession();
                        this.storageLocal.synchroniseLocalPlanners(response.body.data, syncPrefs);
                    }
                )
                .catch(err => {
                    if (err.status == 405)
                        this.model.modalError = 'error.apinotavailable';
                    if (err.status == 400)
                        this.model.modalError = 'error.usernotavailable';
                });//400 - bad request (name exists), 200 success returns uuid and subscription
        }
    }
    deleteRegistration (){
        request
            .delete('/api/planner/' + this.storageLocal.getLocalSession()?.['0'])
            .send({})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = '';
                    this.model.subscription = -1
                }
            )
            .catch(err => {
                this.model.error = err;
            });//404 - (uuid not found)), 200 success returns no data

    }
    setUsername (username) {
        this.modalErr('username', null);
        if (!this.model.username) {
            // this.model.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (this.model.modalErrorTarget['username']) {
            return;
        }
        request
            .post('/api/profile/' + this.model.uuid + '/username')
            .send({username: username})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.username = response.body.username;
                    this.model.donation = response.body.donation;
                    this.model.email = response.body.email;
                    this.model.emailverified = response.body.emailverified;
                    this.model.mobile = response.body.mobile;
                    this.model.mobileverified = response.body.mobileverified;
                    this.model.changeuser = false;
                    this.model.modalSuccess = i18n.t('success.usernamechanged');
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                if (err.status == 400)
                    this.model.modalError = 'error.usernotavailable';
            })
    }
    setPassword (password, newpassword){
        this.modalErr('password', null);
        this.modalErr('newpassword', null);
        if (!this.model.password) {
            // this.model.modalWarning = 'warn.passwordnotprovided'
            this.modalErr('password', 'warn.passwordnotprovided')
        }
        if (!this.model.newpassword) {
            // this.model.modalWarning = 'warn.passwordnotprovided'
            this.modalErr('newpassword', 'warn.passwordnotprovided')
        }
        if (this.model.modalErrorTarget['password'] || this.model.modalErrorTarget['newpassword']) {
            return;
        }

        request
            .post('/api/profile/' + this.model.uuid + '/password')
            .send({password: password, newpassword: newpassword})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.donation = response.body.donation;
                    this.model.email = response.body.email;
                    this.model.emailverified = response.body.emailverified;
                    this.model.mobile = response.body.mobile;
                    this.model.mobileverified = response.body.mobileverified;
                    this.model.password = '';
                    this.model.newpassword = '';
                    this.model.changepass = false;
                    this.model.modalSuccess = i18n.t('success.passwordchanged');
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.passwordincorrect';
            })
    }
    setEmail (email){
        this.modalErr('email', null);
        if (!this.model.email) {
            // this.model.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('email', 'warn.emailnotprovided')
        }
        if (this.model.modalErrorTarget['email']) {
            return;
        }
        request
            .post('/api/profile/' + this.model.uuid + '/email')
            .send({email: email})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.donation = response.body.donation;
                    this.model.email = response.body.email;
                    this.model.emailverified = response.body.emailverified;
                    this.model.mobile = response.body.mobile;
                    this.model.mobileverified = response.body.mobileverified;
                    this.model.changeemail = false;
                    this.model.modalSuccess = i18n.t('success.emailchanged');
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }
    setMobile (mobile){
        request
            .post('/api/profile/' + this.model.uuid + '/mobile')
            .send({mobile: mobile})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.donation = response.body.donation;
                    this.model.email = response.body.email;
                    this.model.emailverified = response.body.emailverified;
                    this.model.mobile = response.body.mobile;
                    this.model.mobileverified = response.body.mobileverified;
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }
    squarePayment (nonce, idempotency_key){
        request
            .post('/api/payment')
            .send({
                nonce: nonce,
                idempotency_key: idempotency_key,
                // location_id: "REPLACE_WITH_LOCATION_ID"
                // location_id: "LDF5NP9BZJ0CP", //SANDBOX
                location_id: "L15E6C1JAT7BD", //live
                uuid: this.model.uuid
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .then(response => {
                    let result = JSON.parse(response.body.text)
                    this.model.paymentSuccess = true;
                    this.model.receiptUrl = result.payment.receipt_url;
                    this.setDonation(result.payment.receipt_url);
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            });

    }
    setDonation (receipt_url){
        request
            .post('/api/profile/' + this.model.uuid + '/donation')
            .send({
                receiptUrl: receipt_url,
                subject: i18n.t('label.donationSubject'),
                bodyText: i18n.t('label.donationBody') + '\n\n\t' + receipt_url
            })
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.donation = response.body.donation;
                    this.model.email = response.body.email;
                    this.model.emailverified = response.body.emailverified;
                    this.model.mobile = response.body.mobile;
                    this.model.mobileverified = response.body.mobileverified;
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }
    sendVerificationEmail (){
        request
            .post('/api/verify/' + this.model.uuid)
            .send({subject: i18n.t('label.verifySubject'), bodyText: i18n.t('label.verifyBody')})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.modalSuccess = i18n.t('success.verifySent')
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }
    verifyEmailToken (token, model){
        if (token) {
            request
                .post('/api/verify/email/' + token)
                .send({})
                .set('Accept', 'application/json')
                .then(response => {
                        this.model.response = response;
                        this.model.emailverified = response.body.emailverified;
                    }
                )
                .catch(err => {
                    if (err.status == 405)
                        this.model.error = 'error.apinotavailable';
                    if (err.status == 404)
                        this.model.error = 'error.apinotavailable';
                    if (err.status == 401)
                        this.model.error = 'error.unauthorized';
                })

        }

    }
    sendRecoverPasswordEmail(username){
        this.modalErr('username', null);
        if (!this.model.username) {
            // this.model.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (this.model.modalErrorTarget['username']) {
            return;
        }
        request
            .post('/api/verify/' + this.model.uuid)
            .send({subject: i18n.t('label.recoverPassSubject'), bodyText: i18n.t('label.recoverPassBody')})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.modalSuccess = i18n.t('success.recoverPassSent')
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }
    sendRecoverUsernameEmail(email) {
        this.modalErr('email', null);
        if (!this.model.email) {
            // this.model.modalWarning = 'warn.usernamenotprovided'
            this.modalErr('email', 'warn.emailnotprovided')
        }
        if (this.model.modalErrorTarget['email']) {
            return;
        }
        request
            .post('/api/verify/' + this.model.uuid)
            .send({subject: i18n.t('label.recoverUserSubject'), bodyText: i18n.t('label.recoverUserBody')})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.modalSuccess = i18n.t('success.recoverUserSent')
                }
            )
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }
    email(to, subject, bodyText) {
        request
            .post('/api/email')
            .send({to: [to], subject: subject, bodyText: bodyText})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                }
            )
            .catch(err => {
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 500)
                    this.model.modalError = 'error.general';
            })
    }
    modalErr (target,err) {
        if (!model.modalErrorTarget){
            model.modalErrorTarget = {};
        }
        model.modalErrorTarget[target] =  err;
        model.touch = model.touch ? '': ' ';
    }

}
