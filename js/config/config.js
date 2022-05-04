import { ConfigFactory } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@2/dist/alt-javascript-config-esm.js'

export default ConfigFactory.getConfig({
    logging : {
        level : {
            "/" : "warn",
        }
    },
    "http://127+0+0+1:8080/" : {
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
