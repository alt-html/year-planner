import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

import { model } from "../vue/model.js";

async function fetchJSON(url, options = {}) {
    const headers = {
        'Accept': 'application/json',
        ...options.headers,
    };
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

//  Client SDK to server side API
export default class Api {
    constructor(model, storageLocal, storageRemote, i18n) {
        this.qualifier = '@alt-html/year-planner/Api'
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this.storageRemote = storageRemote;
        this.i18n = i18n;
    }

    register (username, password, email, mobile){
        fetchJSON(`${this.url}api/planner`, {
            method: 'PUT',
            body: JSON.stringify({
                username: this.model.username,
                password: this.model.password,
                email: this.model.email,
                mobile: this.model.mobile,
                subject: this.i18n.global.t('label.verifySubject'),
                bodyText: this.i18n.global.t('label.verifyBody')
            }),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = body.uuid;
                this.model.donation = body.donation;
                this.model.storageLocal.extendLocalSession();
                this.model.signedin = this.storageLocal.signedin();
                this.model.registered = this.storageLocal.registered();
                $('#registerModal').modal('hide');
            })
            .catch(err => {
                this.logger?.warn("Register Failed.",err);
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 400)
                    this.model.modalError = 'error.usernotavailable';
                else
                    this.model.modalError = 'error.syncfailed';
            });
    }

    signin (username, password, rememberme){
        fetchJSON(`${this.url}api/planner`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(username + ':' + password),
            },
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = body.uuid;
                this.model.username = body.username;
                this.model.donation = body.donation;
                this.model.email = body.email;
                this.model.emailverified = body.emailverified;
                this.model.mobile = body.mobile;
                this.model.mobileverified = body.mobileverified;
                $('#signinModal').modal('hide');
                if (this.model.rememberme) {
                    this.storageLocal.setLocalSession(this.model.uuid, 0);
                } else {
                    this.storageLocal.setLocalSession(this.model.uuid, DateTime.local().plus({minutes: 30}).ts);
                }
                this.model.signedin = this.storageLocal.signedin();
                this.model.registered = this.storageLocal.registered();

                this.storageRemote.synchroniseLocalPlanners(body.data, true);
                this.model.uid = body.data['1']?.['2'] || this.model.uid;
                this.model.year = body.data['1']?.['3'] || this.model.year;

                window.location.href = window.location.origin + '?uid=' + this.model.uid + '&year=' + this.model.year;
            })
            .catch(err => {
                this.logger?.warn("Sign in Failed.",err);
                this.model.modalError = 'error.apinotavailable';
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
            })
    }

    getData(){
        let localSession = this.storageLocal.getLocalSession();
        let uid = localSession[2];
        let data = {}
        data["0"] =  localSession;
        data[`uid`] = this.storageLocal.getLocalPreferences(uid)
    }

    synchroniseToRemote (){
        if (this.storageLocal.signedin()) {

            this.storageLocal.registerRemoteIdentity(this.model.uid);

            let localSession = this.storageLocal.getLocalSession();
            let localData = this.storageLocal.getLocalStorageData()
            fetchJSON(`${this.url}api/planner/` + localSession?.['0'], {
                method: 'POST',
                body: JSON.stringify(localData),
            })
                .then(body => {
                    this.storageLocal.extendLocalSession();
                })
                .catch(err => {
                    if (err.status == 404)
                        this.model.error = 'error.apinotavailable';
                    else if (err.status == 401)
                        this.model.error = 'error.unauthorized';
                    else
                        this.model.error = 'error.syncfailed';
                })
        }
    }

    synchroniseToLocal (syncPrefs){
        if (this.storageLocal.signedin()) {
            let localSession = this.storageLocal.getLocalSession();

            fetchJSON(`${this.url}api/planner/` + localSession?.['0'], {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer '+localSession?.['0']+'.'+localSession?.['1'],
                },
            })
                .then(body => {
                    this.model.response = body;
                    this.model.uuid = body.uuid;
                    this.model.username = body.username;
                    this.model.donation = body.donation;
                    this.model.email = body.email;
                    this.model.emailverified = body.emailverified;
                    this.model.mobile = body.mobile;
                    this.model.mobileverified = body.mobileverified;
                    this.storageLocal.extendLocalSession();
                    this.storageRemote.synchroniseLocalPlanners(body.data, syncPrefs);
                })
                .catch(err => {
                    if (err.status == 405)
                        this.model.error = 'error.apinotavailable';
                    else if (err.status == 400)
                        this.model.error = 'error.usernotavailable';
                    else
                        this.model.error = 'error.syncfailed';
                });
        }
    }

    deleteRegistration (){
        fetchJSON(`${this.url}api/planner/` + this.storageLocal.getLocalSession()?.['0'], {
            method: 'DELETE',
            body: JSON.stringify({}),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = '';
                this.model.subscription = -1
            })
            .catch(err => {
                this.model.error = 'error.syncfailed';
            });
    }

    setUsername (username) {
        this.modalErr('username', null);
        if (!this.model.username) {
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (this.model.modalErrorTarget['username']) {
            return;
        }
        fetchJSON(`${this.url}api/profile/` + this.model.uuid + '/username', {
            method: 'POST',
            body: JSON.stringify({username: username}),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = body.uuid;
                this.model.username = body.username;
                this.model.donation = body.donation;
                this.model.email = body.email;
                this.model.emailverified = body.emailverified;
                this.model.mobile = body.mobile;
                this.model.mobileverified = body.mobileverified;
                this.model.changeuser = false;
                this.model.modalSuccess = i18n.global.t('success.usernamechanged');
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                else if (err.status == 400)
                    this.model.modalError = 'error.usernotavailable';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    setPassword (password, newpassword){
        this.modalErr('password', null);
        this.modalErr('newpassword', null);
        if (!this.model.password) {
            this.modalErr('password', 'warn.passwordnotprovided')
        }
        if (!this.model.newpassword) {
            this.modalErr('newpassword', 'warn.passwordnotprovided')
        }
        if (this.model.modalErrorTarget['password'] || this.model.modalErrorTarget['newpassword']) {
            return;
        }

        fetchJSON(`${this.url}api/profile/` + this.model.uuid + '/password', {
            method: 'POST',
            body: JSON.stringify({password: password, newpassword: newpassword}),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = body.uuid;
                this.model.donation = body.donation;
                this.model.email = body.email;
                this.model.emailverified = body.emailverified;
                this.model.mobile = body.mobile;
                this.model.mobileverified = body.mobileverified;
                this.model.password = '';
                this.model.newpassword = '';
                this.model.changepass = false;
                this.model.modalSuccess = i18n.global.t('success.passwordchanged');
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.passwordincorrect';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    setEmail (email){
        this.modalErr('email', null);
        if (!this.model.email) {
            this.modalErr('email', 'warn.emailnotprovided')
        }
        if (this.model.modalErrorTarget['email']) {
            return;
        }
        fetchJSON(`${this.url}api/profile/` + this.model.uuid + '/email', {
            method: 'POST',
            body: JSON.stringify({email: email}),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = body.uuid;
                this.model.donation = body.donation;
                this.model.email = body.email;
                this.model.emailverified = body.emailverified;
                this.model.mobile = body.mobile;
                this.model.mobileverified = body.mobileverified;
                this.model.changeemail = false;
                this.model.modalSuccess = i18n.global.t('success.emailchanged');
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    setMobile (mobile){
        fetchJSON(`${this.url}api/profile/` + this.model.uuid + '/mobile', {
            method: 'POST',
            body: JSON.stringify({mobile: mobile}),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = body.uuid;
                this.model.donation = body.donation;
                this.model.email = body.email;
                this.model.emailverified = body.emailverified;
                this.model.mobile = body.mobile;
                this.model.mobileverified = body.mobileverified;
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    sendVerificationEmail (){
        fetchJSON(`${this.url}api/verify/` + this.model.uuid, {
            method: 'POST',
            body: JSON.stringify({subject: i18n.global.t('label.verifySubject'), bodyText: i18n.global.t('label.verifyBody')}),
        })
            .then(body => {
                this.model.modalSuccess = i18n.global.t('success.verifySent')
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    verifyEmailToken (token, model){
        if (token) {
            fetchJSON(`${this.url}api/verify/email/` + token, {
                method: 'POST',
                body: JSON.stringify({}),
            })
                .then(body => {
                    this.model.response = body;
                    this.model.emailverified = body.emailverified;
                })
                .catch(err => {
                    if (err.status == 405)
                        this.model.error = 'error.apinotavailable';
                    else if (err.status == 404)
                        this.model.error = 'error.apinotavailable';
                    else if (err.status == 401)
                        this.model.error = 'error.unauthorized';
                    else
                        this.model.error = 'error.syncfailed';
                })
        }
    }

    sendRecoverPasswordEmail(username){
        this.modalErr('username', null);
        if (!this.model.username) {
            this.modalErr('username', 'warn.usernamenotprovided')
        }
        if (this.model.modalErrorTarget['username']) {
            return;
        }
        fetchJSON(`${this.url}api/verify/` + this.model.uuid, {
            method: 'POST',
            body: JSON.stringify({subject: i18n.global.t('label.recoverPassSubject'), bodyText: i18n.global.t('label.recoverPassBody')}),
        })
            .then(body => {
                this.model.modalSuccess = i18n.global.t('success.recoverPassSent')
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    sendRecoverUsernameEmail(email) {
        this.modalErr('email', null);
        if (!this.model.email) {
            this.modalErr('email', 'warn.emailnotprovided')
        }
        if (this.model.modalErrorTarget['email']) {
            return;
        }
        fetchJSON(`${this.url}api/verify/` + this.model.uuid, {
            method: 'POST',
            body: JSON.stringify({subject: i18n.global.t('label.recoverUserSubject'), bodyText: i18n.global.t('label.recoverUserBody')}),
        })
            .then(body => {
                this.model.modalSuccess = i18n.global.t('success.recoverUserSent')
            })
            .catch(err => {
                if (err.status == 405)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 401)
                    this.model.modalError = 'error.unauthorized';
                else
                    this.model.modalError = 'error.syncfailed';
            })
    }

    email(to, subject, bodyText) {
        fetchJSON(`${this.url}api/email`, {
            method: 'POST',
            body: JSON.stringify({to: [to], subject: subject, bodyText: bodyText}),
        })
            .then(body => {
                this.model.response = body;
            })
            .catch(err => {
                if (err.status == 404)
                    this.model.modalError = 'error.apinotavailable';
                else if (err.status == 500)
                    this.model.modalError = 'error.general';
                else
                    this.model.modalError = 'error.syncfailed';
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
