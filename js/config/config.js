import { ConfigFactory } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@2/dist/alt-javascript-config-esm.js'

export default ConfigFactory.getConfig({
    api : {
        url : 'http://127.0.0.1:8081/'
    },
    cookies : {
        samesite : 'Strict'
    },
    logging : {
        level : {
            "/" : "warn",
        }
    },
    "http://127+0+0+1:8080/" : {
        api : {
            url : 'http://127.0.0.1:8081/'
        },
        cookies : {
            samesite : 'None; Secure'
        },
        logging : {
            format : "text",
            level : {
                "/" : "info",
                "@alt-javascript/cookies" : "info",
                "@alt-javascript/cdi" : "verbose",
            }
        }
    }
})
