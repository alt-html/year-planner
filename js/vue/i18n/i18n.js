import { messages } from './messages.js'
import { urlParam } from '../../util/urlparam.js';

export const getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';

export const i18n = VueI18n.createI18n ({
    locale: (urlParam('lang') || 'en').substring(0,2), // set locale
    fallbackLocale: 'en',
    messages, // set locale messages
});
