import { messages } from './i18n/messages.js'

export const getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';

// Locale is intentionally set to 'en' here and overridden in Application.run()
// once the resolved startup language is known from preferences/system defaults (R103).
export const i18n = VueI18n.createI18n ({
    locale: 'en',
    fallbackLocale: 'en',
    messages,
});
