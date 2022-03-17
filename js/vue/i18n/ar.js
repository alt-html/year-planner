// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
    label : {
        yearplanner : 'مخطط العام',
        accept : 'قبول',
        cookies : 'هذا الموقع يستخدم الكوكيز.',reset:'إعادة ضبط',
        close:'يغلق',
        new:'جديد',
        update:'تحديث',
        delete:'حذف',deleteplanner:'تأكيد حذف المخطط الحالي؟',
        share:'يشارك',
        sharecopy:'مشاركة نسخة',
        copy:'انسخه',
        entryplaceholder:'في هذا اليوم …',
        created:'مخلوق',
        updated : 'محدث',
        none : 'لا أحد',
        rename : 'إعادة تسمية',untitled : 'بدون عنوان',
        month:'شهر',year:'سنة',week:'أسبوع',semester:'نصف السنة',term:'شرط',today:'اليوم',
        theme:'سمة',light:'ضوء',dark:'داكن',
        register: 'يسجل', username: 'اسم المستخدم', password : 'كلمه السر', email: 'بريد إلكتروني', mobile :'تليفون محمول',haveaccount:'هل لديك حساب',
        signin:  'تسجيل الدخول', signout: 'خروج', rememberme: 'ابقني مسجل',forgotpass :'نسيت كلمة المرور الخاصة بي', forgotuser : 'نسيت اسم المستخدم الخاص بي',noaccount:'ليس لديك حساب',
        settings: 'Settings…', profile: 'الملف الشخصي', verify : 'تحقق', verified : 'تم التحقق', unverified : 'لم يتم التحقق منه', changepass : 'تغيير كلمة المرور', oldpassword : 'كلمة سر قديمة', newpassword : 'كلمة السر الجديدة',
        verifySubject: 'مخطط العام التحقق من البريد الإلكتروني', verifyBody: 'يرجى التحقق من عنوان بريدك الإلكتروني من خلال النقر على الرابط أدناه',
        resetPassword: 'إعادة تعيين كلمة المرور', recoverPassSubject: 'مخطط العام إعادة تعيين كلمة المرور', recoverPassBody: 'إعادة تعيين كلمة مرور حساب مخطط العام الخاص بك هي\n\n\t',
        recover:'استعادة', recoverUsername: 'استعادة اسم المستخدم', recoverUserSubject: 'مخطط العام استرداد اسم المستخدم', recoverUserBody: 'اسم حساب مخطط العام الخاص بك هو\n\n\t',
        donate: 'يتبرع', give :'أعط 1.00 دولار أسترالي', donatespiel: 'تبرع يخفي زر التبرع لمدة عام واحد', donationaccepted:'التبرع مقبول',donationreceipt:'إيصال التبرع الخاص بك',
        donationSubject:'مخطط السنة إيصال التبرع',donationBody:'شكرا لتبرعك يمكن العثور على إيصالك هنا\n\n\t',
        cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
    },
    success: {
        verifySent : 'تم إرسال بريد إلكتروني للتحقق',
        recoverPassSent : 'تم إرسال كلمة مرور جديدة إلى عنوان البريد الإلكتروني الخاص بحسابك الذي تم التحقق منه',
        recoverUserSent : 'تم إرسال اسم المستخدم الخاص بك إلى عنوان البريد الإلكتروني لحسابك الذي تم التحقق منه',
        usernamechanged : 'تم تغيير اسم المستخدم',
        passwordchanged : 'تم تغيير كلمة المرور',
        emailchanged : 'تم تغيير البريد الإلكتروني. انقر فوق الزر إرسال لإرسال بريد إلكتروني للتحقق'
    },
    warn: {
        usernamenotprovided:'يجب تقديم اسم مستخدم',
        passwordnotprovided:'يجب توفير كلمة مرور'
    },
    error: {
        apinotavailable: 'واجهة برمجة تطبيقات مخطط السنة البعيدة غير متاحة',
        usernotavailable: 'اسم المستخدم غير متوفر',
        unauthorized: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        passwordincorrect: 'كلمة المرور غير صحيحة',
    },
    month : {
        January: 'كانون الثاني', February: 'شهر فبراير', March : 'مارس', April:'أبريل', May:'يمكن',June:'يونيو',July:'يوليو',August:'شهر اغسطس',September:'سبتمبر',October:'اكتوبر',November:'شهر نوفمبر',December:'ديسمبر'
    },
    day :{
        Monday:'يوم الاثنين',Tuesday:'يوم الثلاثاء',Wednesday:'الأربعاء',Thursday:'يوم الخميس',Friday:'يوم الجمعة',Saturday:'يوم السبت',Sunday:'يوم الأحد'
    },
    lang: lang
}
