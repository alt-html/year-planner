export default {
    api: {
        url: 'http://127.0.0.1:8081/'
    },
    logging: {
        level: {
            '/': 'warn',
        }
    },
    profiles: {
        urls: {
            'localhost:8080':  'dev',
            '127.0.0.1:8080': 'dev',
        },
        dev: {
            logging: {
                format: 'text',
                level: {
                    '/': 'debug',
                }
            }
        }
    }
};
