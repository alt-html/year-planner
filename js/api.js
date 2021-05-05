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

var synchroniseToLocal = function (){

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
                    synchroniseLocalPlanners(response.body.data);
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
                if (rememberme){
                    setLocalSession(model.uuid,0);
                }else {
                    extendLocalSession();
                }
                model.signedin = signedin();
                model.registered = registered();
                synchroniseLocalPlanners(response.body.data);
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
    expireLocalSession();
    model.signedin = signedin();
    model.registered = registered();
    wipe();
}

var signedin = function (){
    expires = getLocalSession()?.['1'];
    return expires != null && (expires > 0 && expires >= DateTime.now().ts) || expires == 0;
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
