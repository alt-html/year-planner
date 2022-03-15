export let feature = {
    debug : false,
    profile : true,
    register : true,
    signin : true,
    import : false,
    export : false,
    donate : true,
    pay : false
};

export function ftoggle (fname){
    feature[fname] = !feature[fname];
    return feature[fname];
}
