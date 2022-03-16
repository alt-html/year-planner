export default class Cookies {

    constructor(logger) {
        this.qualifier = '@alt-javascript/cookies'
        this.logger = logger;
     }

    setCookie (cname, cvalue, exdays,samesite) {
        let d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        let cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite="+(samesite||"Strict")
        document.cookie = cookie;
        this.logger?.debug(`Set document.cookie as: ${cookie}`);
    }

    deleteCookie (cname) {
        let d = new Date();
        d.setTime(0);
        let expires = "expires=" + d.toUTCString();
        let cookie = cname + "=;" + expires + ";path=/"
        document.cookie = cookie;
        this.logger?.debug(`Delete (expire) document.cookie as: ${cname}=${cookie}`);
    }

    getCookie (cname) {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                let cookie = c.substring(name.length, c.length);
                this.logger?.debug(`Found cookie: ${cname}=${cookie}`);
                return c.substring(name.length, c.length);
            }
        }
        this.logger?.debug(`Cookie not found: ${cname}`);
        return "";
    }

    getCookies () {
        let cookies = document.cookie.split(';').reduce((cookies, cookie) => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            cookies[name] = value;
            return cookies;
        }, {});
        this.logger?.debug(`Found cookies: ${cookies}`);
        return cookies;
    }
}
