export const feature = {
    debug : false,
    profile : true,
    register : true,
    signin : true,
    import : false,
    export : false,
    donate : false,
    pay : false
};

export function ftoggle(fname) {
    feature[fname] = !feature[fname];
    return feature[fname];
}
