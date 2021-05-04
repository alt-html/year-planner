var synchronise = function (){

     // for each remote uid-year
      // get the the local uid-year last updated
      // get the the remote uid-year last updated
      // if the remote uid-year is more recent 9 (default 0 for no local uid) then
          // set the local uid-year from the remote
     // if the remote default uid [index 0] is different
         // set the local default to the remote
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
    wipe();
}

var signedin = function (){
    expires = getLocalSession()?.['1'];
    return expires != null && (expires > 0 && expires >= DateTime.now().ts) || expires == 0;
}

var registered = function (){
    return (!!getLocalSession());
}

var deleteRegistration = function(uuid){
    request
        .delete('/api/planner/'+uuid)
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
