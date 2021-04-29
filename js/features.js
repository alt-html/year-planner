var feature = {
    debug : false,
    settings : false,
    register : false,
    signin : false,
    import : false,
    export : false,
    donate : false,
    pay : false
};

var ftoggle = function (fname){
    feature[fname] = !feature[fname];
    return feature[fname];
}