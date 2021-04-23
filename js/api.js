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

    request
        .put('/api/planner')
        .send({username:username,password:password,email:email,mobile:mobile})
        .set('Accept','application/json')
        .then(response => {
                model.uuid = response.body.uuid;
                model.donation = response.body.donation;
            }

        )
        .catch(err => {
            if (err.status == 405)
                model.modalError = 'error.apinotavailable';
            if (err.status == 400)
                model.modalError = 'error.usernotavailable';
        });//400 - bad request (name exists), 200 success returns uuid and subscription
}

var signin = function(username,password){
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
            }) //401 - unauthorised, 200 success returns uuid and subscription
}


var deleteRegistration = function(uuid){
    request
        .delete('/api/planner/'+uuid)
        .send({})
        .set('Accept','application/json')
        .then(response => {
                model.uuid = '';
                model.subscription = -1
            }

        )
        .catch(err => {
            model.error = err;
        });//404 - (uuid not found)), 200 success returns no data

}
