// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
    label : {
        yearplanner : 'वर्ष नियोजक',
        accept : 'स्वीकार करना',
        cookies : 'यह वेबसाइट कुकीज़ का उपयोग करती है।',reset:'रीसेट',
        close:'बंद करे',
        update:'अपडेट करें',
        new:'नवीन व',
        delete:'हटाएं',deleteplanner:'वर्तमान योजनाकार को हटाने की पुष्टि करें?',
        share:'शेयर',
        sharecopy:'एक प्रति साझा करें',
        copy:'कॉपी',
        entryplaceholder:'इस दिन …',
        created:'बनाया था',
        updated : 'अद्यतन',
        none : 'कोई नहीं',
        rename : 'नाम बदलें',untitled : 'शीर्षकहीन',
        month:'महीना',year:'साल',week:'सप्ताह',semester:'छमाही',term:'अवधि',today:'आज',
        theme:'विषय',light:'रोशनी',dark:'अंधेरा',
        register: 'रजिस्टर करें', username: 'उपयोगकर्ता नाम', password : 'कुंजिका', email: 'ईमेल', mobile :'मोबाइल फोन',haveaccount:'पहले से ही एक खाता है',
        signin:  'दाखिल करना', signout: 'प्रस्थान करें', rememberme: 'मुझे सिग्ने ईन में रखना',forgotpass :'अपना पासवर्ड भूल गया', forgotuser : 'मेरा उपयोगकर्ता नाम भूल गए',noaccount:'खाता नहीं है?',
        settings: 'Settings…', profile: 'प्रोफ़ाइल', verify : 'सत्यापित करें', verified : 'सत्यापित', unverified : 'असत्यापित', changepass : 'पासवर्ड बदलें', oldpassword : 'पुराना पासवर्ड', newpassword : 'नया पासवर्ड',
        verifySubject: 'वर्ष योजनाकार ईमेल सत्यापन', verifyBody: 'कृपया नीचे दिए गए लिंक पर क्लिक करके अपना ईमेल पता सत्यापित करें\n\n\t',
        resetPassword: 'पासवर्ड रीसेट', recoverPassSubject: 'वर्ष योजनाकार पासवर्ड रीसेट करें', recoverPassBody: 'आपका रीसेट वर्ष योजनाकार खाता पासवर्ड है\n\n\t',
        recover:'वसूली', recoverUsername: 'उपयोगकर्ता नाम पुनर्प्राप्त करें', recoverUserSubject: 'वर्ष योजनाकार उपयोगकर्ता नाम पुनर्प्राप्त करें', recoverUserBody: 'आपके वर्ष योजनाकार खाते का नाम है\n\n\t',
        donate: 'दान करना', give :'AUD 1.00 . दें', donatespiel: 'एक दान एक वर्ष के लिए दान करें बटन को छुपाता है।', donationaccepted:'दान स्वीकृत।',donationreceipt:'आपकी दान रसीद',
        donationSubject:'वर्ष योजनाकार दान रसीद',donationBody:'आपके दान के लिए धन्यवाद आपकी रसीद यहां मिल सकती है\n\n\t',
        cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
    },
    success: {
        verifySent : 'एक सत्यापन ईमेल भेजा गया है',
        recoverPassSent : 'आपके सत्यापित खाते के ईमेल पते पर एक नया पासवर्ड भेज दिया गया है।',
        recoverUserSent : 'आपका उपयोगकर्ता नाम आपके सत्यापित खाते के ईमेल पते पर भेज दिया गया है',
        usernamechanged : 'उपयोगकर्ता नाम बदल दिया गया है',
        passwordchanged : 'पासवर्ड बदला जा चुका है',
        emailchanged : 'ईमेल बदल दिया गया है। सत्यापन ईमेल भेजने के लिए भेजें बटन पर क्लिक करें'
    },
    warn: {
        usernamenotprovided:'एक उपयोगकर्ता नाम प्रदान किया जाना चाहिए',
        passwordnotprovided:'एक पासवर्ड प्रदान किया जाना चाहिए'
    },
    error: {
        apinotavailable: 'दूरस्थ वर्ष प्लानर एपीआई उपलब्ध नहीं है',
        usernotavailable: 'उपयोगकर्ता नाम उपलब्ध नहीं है',
        unauthorized: 'उपयोगकर्ता नाम या पासवर्ड सही नहीं है',
        passwordincorrect: 'पासवर्ड सही नहीं है',
    },
    month : {
        January: 'जनवरी', February: 'फ़रवरी', March : 'जुलूस', April:'अप्रैल', May:'मई',June:'जून',July:'जुलाई',August:'अगस्त',September:'सितंबर',October:'अक्टूबर',November:'नवंबर',December:'दिसंबर'
    },
    day :{
        Monday:'सोमवार',Tuesday:'मंगलवार',Wednesday:'बुधवार',Thursday:'गुरूवार',Friday:'शुक्रवार',Saturday:'शनिवार',Sunday:'रविवार'
    },
    lang: lang
}
