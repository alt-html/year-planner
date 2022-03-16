import { ConfigFactory } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config/dist/alt-javascript-config-esm.js'

export default ConfigFactory.getConfig({
    logging : {
        level : {
            "/" : "warn",
            "@alt-javascript/cookies" : "debug",
        }
    },
    "http://127+0+0+1:8080" : {
        logging : {
            level : {
                "/" : "info",
                "@alt-javascript/cookies" : "info",
            }
        }
    }
})
