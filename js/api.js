var subscribe = function(username,password,email,mobile){
    request
        .put('/api/planner')
        .send({username:username,password:password,email:email,mobile:mobile})
        .set('Accept','application/json')
        .then(response => {
                model.uuid = response.body.uuid;
                model.subscription = response.body.subscription;
            }

        )
        .catch(err => {
            model.error = err;
        });//400 - bad request (name exists), 200 success returns uuid and subscription

}

var login = function(username,password){
    request
        .get('/api/planner')
        .auth(username, password)
        .then(response => {
                model.uuid = response.body.uuid;
                model.subscription = response.body.subscription;
                model.email = response.body.email;
                model.mobile = response.body.mobile;
            }

        )
        .catch(err => {
                        model.error = err;
            }) //401 - unauthorised, 200 success returns uuid and subscription
}


var deleteSubscriber = function(uuid){
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
