var feature = {
    debug : false,
    settings : false,
    signin : false,
    signout : false,
    register : false,
    donate : false,
    subscribe : false,
    pay : true
};

var ftoggle = function (fname){
    feature[fname] = !feature[fname];
    return feature[fname];
}