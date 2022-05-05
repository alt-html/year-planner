import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

import { model } from "../vue/model.js";

//  Client SDK to server side API
export default class Api {
    constructor(model, storageLocal, i18n) {
        this.qualifier = '@alt-html/year-planner/Api'
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this.i18n = i18n;
    }

    register (username, password, email, mobile){

        request
            .put(`${this.url}api/planner`)
            .send({
                username: this.model.username,
                password: this.model.password,
                email: this.model.email,
                mobile: this.model.mobile,
                subject: this.i18n.global.t('label.verifySubject'),
                bodyText: this.i18n.global.t('label.verifyBody')
            })
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.donation = response.body.donation;
                    this.model.storageLocal.extendLocalSession();
                    this.model.signedin = this.storageLocal.signedin();
                    this.model.registered = this.storageLocal.registered();
                    $('#registerModal').modal('hide');
                }
            )
            .catch(err => {
                this.logger?.warn("Register Failed.",err); // not an error from an apps perspective
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 400)
                    this.model.modalError = 'error.usernotavailable';
            });//400 - bad request (name exists), 200 success returns uuid and subscription
    }

    signin (username, password, rememberme){


        request
            .get(`${this.url}api/planner`)
            .auth(username, password)
            .then(response => {
                    this.model.response = response;
                    this.model.uuid = response.body.uuid;
                    this.model.username = response.body.username;
                    this.model.donation = response.body.donation;
                    this.model.email = response.body.email;
                    this.model.emailverified = response.body.emailverified;
                    this.model.mobile = response.body.mobile;
                    this.model.mobileverified = response.body.mobileverified;
                    $('#signinModal').modal('hide');
                    if (this.model.rememberme) {
                        this.storageLocal.setLocalSession(this.model.uuid, 0);
                    } else {
                        this.storageLocal.setLocalSession(this.model.uuid, DateTime.local().plus({minutes: 30}).ts);
                    }
                    this.model.signedin = this.storageLocal.signedin();
                    this.model.registered = this.storageLocal.registered();

                    this.storageLocal.synchroniseLocalPlanners(response.body.data, true);
                    this.model.uid = response.body.data['1']?.['2'] || this.model.uid;
                    this.model.year = response.body.data['1']?.['3'] || this.model.year;

                    window.location.href = window.location.origin + '?uid=' + this.model.uid + '&year=' + this.model.year;
                }
            )
            .catch(err => {
                this.logger?.warn("Sign in Failed.",err); // not an error from an apps perspective
                this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            }) //401 - unauthorised, 200 success returns uuid and subscription
    }

    synchroniseToRemote (){
        if (this.storageLocal.signedin()) {

            this.storageLocal.registerRemoteIdentity(this.model.uid);

            request
                .post(`${this.url}api/planner/` + this.storageLocal.getLocalSession()?.['0'])
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
                .get('api/planner/' + this.storageLocal.getLocalSession()?.['0'])
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
            .delete(`${this.url}api/planner/` + this.storageLocal.getLocalSession()?.['0'])
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
            .post(`${this.url}api/profile/` + this.model.uuid + '/username')
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
                    this.model.modalSuccess = i18n.global.t('success.usernamechanged');
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
            .post(`${this.url}api/profile/` + this.model.uuid + '/password')
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
                    this.model.modalSuccess = i18n.global.t('success.passwordchanged');
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
            .post(`${this.url}api/profile/` + this.model.uuid + '/email')
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
                    this.model.modalSuccess = i18n.global.t('success.emailchanged');
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
            .post(`${this.url}api/profile/` + this.model.uuid + '/mobile')
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
            .post(`${this.url}api/payment`)
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
            .post(`${this.url}api/profile/` + this.model.uuid + '/donation')
            .send({
                receiptUrl: receipt_url,
                subject: i18n.global.t('label.donationSubject'),
                bodyText: i18n.global.t('label.donationBody') + '\n\n\t' + receipt_url
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
            .post(`${this.url}api/verify/` + this.model.uuid)
            .send({subject: i18n.global.t('label.verifySubject'), bodyText: i18n.global.t('label.verifyBody')})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.modalSuccess = i18n.global.t('success.verifySent')
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
                .post(`${this.url}api/verify/email/` + token)
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
            .post(`${this.url}api/verify/` + this.model.uuid)
            .send({subject: i18n.global.t('label.recoverPassSubject'), bodyText: i18n.global.t('label.recoverPassBody')})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.modalSuccess = i18n.global.t('success.recoverPassSent')
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
            .post(`${this.url}api/verify/` + this.model.uuid)
            .send({subject: i18n.global.t('label.recoverUserSubject'), bodyText: i18n.global.t('label.recoverUserBody')})
            .set('Accept', 'application/json')
            .then(response => {
                    this.model.modalSuccess = i18n.global.t('success.recoverUserSent')
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
            .post(`${this.url}api/email`)
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
