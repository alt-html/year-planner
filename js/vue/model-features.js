export const feature = {
    debug : false,
    signin : true,
    import : false,
    export : false,
};

export function ftoggle(fname) {
    feature[fname] = !feature[fname];
    return feature[fname];
}
