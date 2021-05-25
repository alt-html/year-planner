var synchroniseToRemote = function (){

    if (signedin()){

        registerRemoteIdentity(model.uid);

        request
            .post('/api/planner/'+getLocalSession()?.['0'])
            .send({})
            .then(response => {
                    extendLocalSession();
                }
            )
            .catch(err => {
                if (err.status == 404)
                    model.error = 'error.apinotavailable';
                if (err.status == 401)
                    model.error = 'error.unauthorized';
            }) //401 - unauthorised, 200 success returns uuid and subscription
        }

}

var synchroniseToLocal = function (syncPrefs){

    if (signedin()){
        request
            .get('/api/planner/'+getLocalSession()?.['0'])
            .set('Accept','application/json')
            .then(response => {
                    model.response = response;
                    model.uuid = response.body.uuid;
                    model.username = response.body.username;
                    model.donation = response.body.donation;
                    model.email = response.body.email;
                    model.emailverified = response.body.emailverified;
                    model.mobile = response.body.mobile;
                    model.mobileverified = response.body.mobileverified;
                    extendLocalSession();
                    synchroniseLocalPlanners(response.body.data, syncPrefs);
                }

            )
            .catch(err => {
                if (err.status == 405)
                    model.modalError = 'error.apinotavailable';
                if (err.status == 400)
                    model.modalError = 'error.usernotavailable';
            });//400 - bad request (name exists), 200 success returns uuid and subscription
    }

}

var register = function(username,password,email,mobile){

    clearModalAlert();
    if (!model.username){
        // model.modalWarning = 'warn.usernamenotprovided'
        modalErr('username','warn.usernamenotprovided')
    }
    if (!model.password){
        // model.modalWarning = 'warn.passwordnotprovided'
        modalErr('password','warn.passwordnotprovided')
    }
    if (model.modalErrorTarget){
        return;
    }

    registerRemoteIdentities();

    request
        .put('/api/planner')
        .send({username:username,password:password,email:email,mobile:mobile,subject:i18n.t('label.verifySubject'),bodyText:i18n.t('label.verifyBody')})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.donation = response.body.donation;
                extendLocalSession();
                model.signedin = signedin();
                model.registered = registered();
                $('#registerModal').modal('hide');
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 400)
                model.modalError = 'error.usernotavailable';
        });//400 - bad request (name exists), 200 success returns uuid and subscription
}

var signin = function(username,password,rememberme){
    clearModalAlert();
    if (!model.username){
        // model.modalWarning = 'warn.usernamenotprovided'
        modalErr('username','warn.usernamenotprovided')
    }
    if (!model.password){
        // model.modalWarning = 'warn.passwordnotprovided'
        modalErr('password','warn.passwordnotprovided')
    }
    if (model.modalErrorTarget){
        return;
    }

    request
        .get('/api/planner')
        .auth(username, password)
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.username = response.body.username;
                model.donation = response.body.donation;
                model.email = response.body.email;
                model.emailverified = response.body.emailverified;
                model.mobile = response.body.mobile;
                model.mobileverified = response.body.mobileverified;
                $('#signinModal').modal('hide');
                if (model.rememberme){
                    setLocalSession(model.uuid,0);
                }else {
                    setLocalSession(model.uuid,DateTime.local().plus({minutes:30}).ts);
                }
                model.signedin = signedin();
                model.registered = registered();

                synchroniseLocalPlanners(response.body.data,true);
                model.uid = response.body.data['1']?.['2'] || model.uid;
                model.year = response.body.data['1']?.['3'] || model.year;

                window.location.href = window.location.origin +'?uid='+model.uid+'&year='+model.year;
            }

        )
        .catch(err => {
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
            }) //401 - unauthorised, 200 success returns uuid and subscription
}

var signout = function(){
    model.uuid = '';
    deleteLocalSession();
    model.signedin = signedin();
    model.registered = registered();
    wipe();
}

var signedin = function (){
    expires = getLocalSession()?.['1'];
    let isSignedIn = (expires != null && (expires > 0 && expires >= DateTime.now().ts) || expires == 0);
    // if (showSignin && !isSignedIn){
    //     showSignin();
    // }
    return isSignedIn;
}

var registered = function (){
    return (!!getLocalSession());
}

var deleteRegistration = function(){
    request
        .delete('/api/planner/'+getLocalSession()?.['0'])
        .send({})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = '';
                model.subscription = -1
            }

        )
        .catch(err => {
            model.error = err;
        });//404 - (uuid not found)), 200 success returns no data

}

var setUsername = function (username){
    modalErr('username',null);
    if (!model.username){
        // model.modalWarning = 'warn.usernamenotprovided'
        modalErr('username','warn.usernamenotprovided')
    }
    if (model.modalErrorTarget['username']){
        return;
    }
    request
        .post('/api/profile/'+model.uuid+'/username')
        .send({username:username})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.username = response.body.username;
                model.donation = response.body.donation;
                model.email = response.body.email;
                model.emailverified = response.body.emailverified;
                model.mobile = response.body.mobile;
                model.mobileverified = response.body.mobileverified;
                model.changeuser = false;
                model.modalSuccess = i18n.t('success.usernamechanged');
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
            if (err.status == 400)
                model.modalError = 'error.usernotavailable';
        })
}

var setPassword = function (password,newpassword){
    modalErr('password',null);
    modalErr('newpassword',null);
    if (!model.password){
        // model.modalWarning = 'warn.passwordnotprovided'
        modalErr('password','warn.passwordnotprovided')
    }
    if (!model.newpassword){
        // model.modalWarning = 'warn.passwordnotprovided'
        modalErr('newpassword','warn.passwordnotprovided')
    }
    if (model.modalErrorTarget['password'] || model.modalErrorTarget['newpassword']){
        return;
    }

    request
        .post('/api/profile/'+model.uuid+'/password')
        .send({password:password, newpassword:newpassword})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.donation = response.body.donation;
                model.email = response.body.email;
                model.emailverified = response.body.emailverified;
                model.mobile = response.body.mobile;
                model.mobileverified = response.body.mobileverified;
                model.password = '';
                model.newpassword = '';
                model.changepass = false;
                model.modalSuccess = i18n.t('success.passwordchanged');
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.passwordincorrect';
        })
}

var setEmail = function (email){
    modalErr('email',null);
    if (!model.email){
        // model.modalWarning = 'warn.usernamenotprovided'
        modalErr('email','warn.emailnotprovided')
    }
    if (model.modalErrorTarget['email']){
        return;
    }
    request
        .post('/api/profile/'+model.uuid+'/email')
        .send({email:email})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.donation = response.body.donation;
                model.email = response.body.email;
                model.emailverified = response.body.emailverified;
                model.mobile = response.body.mobile;
                model.mobileverified = response.body.mobileverified;
                model.changeemail = false;
                model.modalSuccess = i18n.t('success.emailchanged');
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}

var setMobile = function (mobile){
    request
        .post('/api/profile/'+model.uuid+'/mobile')
        .send({mobile:mobile})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.donation = response.body.donation;
                model.email = response.body.email;
                model.emailverified = response.body.emailverified;
                model.mobile = response.body.mobile;
                model.mobileverified = response.body.mobileverified;
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}

var squarePayment = function (nonce,idempotency_key){
    request
        .post('/api/payment')
        .send({
            nonce: nonce,
            idempotency_key: idempotency_key,
            // location_id: "REPLACE_WITH_LOCATION_ID"
            // location_id: "LDF5NP9BZJ0CP", //SANDBOX
            location_id: "L15E6C1JAT7BD", //live
            uuid : model.uuid
        })
        .set('Accept','application/json')
        .set('Content-Type','application/json')
        .then(response => {
            result = JSON.parse(response.body.text)
            model.paymentSuccess = true;
            model.receiptUrl = result.payment.receipt_url;
            setDonation(result.payment.receipt_url);
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        });

}

var setDonation = function (receipt_url){
    request
        .post('/api/profile/'+model.uuid+'/donation')
        .send({receiptUrl:receipt_url,subject:i18n.t('label.donationSubject'),bodyText:i18n.t('label.donationBody')+'\n\n\t'+receipt_url})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
                model.uuid = response.body.uuid;
                model.donation = response.body.donation;
                model.email = response.body.email;
                model.emailverified = response.body.emailverified;
                model.mobile = response.body.mobile;
                model.mobileverified = response.body.mobileverified;
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}
var sendVerificationEmail = function () {
    request
        .post('/api/verify/'+model.uuid)
        .send({subject:i18n.t('label.verifySubject'),bodyText:i18n.t('label.verifyBody')})
        .set('Accept','application/json')
        .then(response => {
                model.modalSuccess = i18n.t('success.verifySent')
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}

var verifyEmailToken = function (token) {
    if (token){
        request
            .post('/api/verify/email/'+token)
            .send({})
            .set('Accept','application/json')
            .then(response => {
                    model.response = response;
                    model.emailverified = response.body.emailverified;
                }
            )
            .catch(err => {
                if (err.status == 405)
                    model.error = 'error.apinotavailable';
                if (err.status == 404)
                    model.error = 'error.apinotavailable';
                if (err.status == 401)
                    model.error = 'error.unauthorized';
            })

    }

}

var sendRecoverPasswordEmail = function (username) {
    modalErr('username',null);
    if (!model.username){
        // model.modalWarning = 'warn.usernamenotprovided'
        modalErr('username','warn.usernamenotprovided')
    }
    if (model.modalErrorTarget['username']){
        return;
    }
    request
        .post('/api/verify/'+model.uuid)
        .send({subject:i18n.t('label.recoverPassSubject'),bodyText:i18n.t('label.recoverPassBody')})
        .set('Accept','application/json')
        .then(response => {
                model.modalSuccess = i18n.t('success.recoverPassSent')
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}

var sendRecoverUsernameEmail = function (email) {
    modalErr('email',null);
    if (!model.email){
        // model.modalWarning = 'warn.usernamenotprovided'
        modalErr('email','warn.emailnotprovided')
    }
    if (model.modalErrorTarget['email']){
        return;
    }
    request
        .post('/api/verify/'+model.uuid)
        .send({subject:i18n.t('label.recoverUserSubject'),bodyText:i18n.t('label.recoverUserBody')})
        .set('Accept','application/json')
        .then(response => {
                model.modalSuccess = i18n.t('success.recoverUserSent')
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}


var email = function (to,subject,bodyText){
    request
        .post('/api/email')
        .send({to:[to],subject:subject,bodyText:bodyText})
        .set('Accept','application/json')
        .then(response => {
                model.response = response;
            }

        )
        .catch(err => {
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 500)
                model.modalError = 'error.general';
        })
}
