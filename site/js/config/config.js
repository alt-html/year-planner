import { ProfileAwareConfig, BrowserProfileResolver } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js';

const activeProfiles = BrowserProfileResolver.resolve({
    urlMappings: {
        'localhost:8080': 'dev',
        '127.0.0.1:8080': 'dev',
    }
});

export default new ProfileAwareConfig({
    api: {
        url: 'http://127.0.0.1:8081/'
    },
    logging: {
        level: {
            '/': 'warn',
        }
    },
    profiles: {
        dev: {
            logging: {
                format: 'text',
                level: {
                    '/': 'debug',
                }
            }
        }
    }
}, activeProfiles);
