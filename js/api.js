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
        .send({username:username,password:password,email:email,mobile:mobile})
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
    request
        .post('/api/profile/'+model.uuid+'/username')
        .send({username:username})
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
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
            if (err.status == 400)
                model.modalError = 'error.usernotavailable';
        })
}

var setPassword = function (password,newpassword){
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
            }

        )
        .catch(err => {
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}

var setEmail = function (email){
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
            }

        )
        .catch(err => {
            if (err.status == 404)
                model.modalError = 'error.apinotavailable';
            if (err.status == 401)
                model.modalError = 'error.unauthorized';
        })
}

var setMobile = function (email){
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
