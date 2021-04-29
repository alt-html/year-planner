var setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

var deleteCookie = function (cname) {
    var d = new Date();
    d.setTime(0);
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=;" + expires + ";path=/";
}

var getCookie = function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var getCookies = function(){
    return document.cookie.split(';').reduce((cookies, cookie) => {
        const [ name, value ] = cookie.split('=').map(c => c.trim());
        cookies[name] = value;
        return cookies;
    }, {});
}


var cookiesAccepted = function(){
    return !(getCookie('0') == '');
}

var acceptCookies = function (){
    if (!cookiesAccepted()){
        $('#cookieModal').modal('show');
    }
    setLocalFromModel();

}
