var feature = {
    debug : false,
    profile : false,
    register : true,
    signin : true,
    import : false,
    export : false,
    donate : false,
    pay : false
};

var ftoggle = function (fname){
    feature[fname] = !feature[fname];
    return feature[fname];
}