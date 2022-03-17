import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';
import { feature } from './model-features.js'

const model = {
    qualifier : '@alt-html/year-planner/controller',
    logger : null,

    DateTime : DateTime,
    nyear : null,
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

