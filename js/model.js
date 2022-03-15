import { DateTime } from './DateTime.js';
import { feature } from './features.js'

const model = {
    DateTime : DateTime,
    // pageLoadTime : pageLoadTime,
    // lang: lang,
    // uid : uid,
    // year: year,
    nyear : null,
    // theme : theme,
    // share : share,
    // name : name,
    rename : false,
    changepass : false,

    // uuid : storageLocal.getLocalSession()?.['0']||'',
    username : '',
    changeuser : false,
    email : '',
    emailverified : 0,
    changeemail: false,
    mobile : '',
    mobileverified : 0,
    password: '',
    newpassword :'',
    peek : false,
    peeknp :false,
    donation : -1,
    rememberme : false,
    paymentSuccess : false,
    receiptUrl : '',

    // identities: storageLocal.getLocalIdentities() || [{0:uid,1:window.navigator.userAgent,2:0,3:0}],
    // preferences: preferences,
    // planner: storage.getPlanner(uid, year),

    month : 0,
    day : 1,
    entry: '',
    entryType : 0,
    entryColour : 0,
    shareUrl: window.location.origin,
    daysOfWeek : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    monthsOfYear : ['January','February','March','April','May','June','July','August','September','October','November','December'],
    firstWeekdayOfMonth : [],
    daysInMonth : [],

    feature : feature,
    error : '',
    warning : '',
    modalError : '',
    modalErrorTarget : null,
    modalWarning : '',
    modalSuccess : '',
    loaded : false,
    touch : '',
}

export { model };

