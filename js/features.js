var feature = {
    debug : false,
    settings : false,
    signin : false,
    register : true,
    donate : false,
    subscribe : false,
    pay : false
};

var ftoggle = function (fname){
    feature[fname] = !feature[fname];
    return feature[fname];
}