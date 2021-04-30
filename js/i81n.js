const messages = {
    en: {
        label : {
            yearplanner : 'Year Planner',
            accept : 'Accept',
            cookies : 'This website uses cookies.',reset:'Reset',
            close:'Close',
            update:'Update',
            new:'New',
            delete:'Delete', deleteplanner:'Confirm delete of the current planner?',
            share:'Share',
            sharecopy:'Share a copy',
            copy:'Copy',
            text:'On this day …',
            created:'Created',
            updated : 'Updated',
            none : 'None',
            rename : 'Rename',untitled : 'Untitled',
            month:'Month',year:'Year',week:'Week',semester:'Semester',term:'Term',today:'Today',
            theme:'Theme',light:'Light',dark:'Dark',
            register: 'Register', username: 'Username', password : 'Password', email: 'Email', mobile :'Mobile',
            settings: 'Settings…', profile: 'Profile', verify : 'Verify',
            signin:  'Sign In', signout: 'Sign Out', rememberme: 'Keep me signed in',forgotpass :'Forgot my password', forgotuser : 'Forgot my username',
            donate: 'Donate'
    },
        warn: {
            usernamenotprovided:'A username must be provided',
            passwordnotprovided:'A password must be provided'
        },
        error: {
            apinotavailable: 'The remote year planner API is not available',
            usernotavailable: 'The username is not available',
            unauthorized: 'Username or password is not correct'
        },
        month : {
            January: 'January', February: 'February', March : 'March', April:'April', May:'May',June:'June',July:'July',August:'August',September:'September',October:'October',November:'November',December:'December'
        },
        day :{
            Monday:'Monday',Tuesday:'Tuesday',Wednesday:'Wednesday',Thursday:'Thursday',Friday:'Friday',Saturday:'Saturday',Sunday:'Sunday'
        },
        lang: {en:'English', zh:'中國人', hi:'हिन्दी', es:'español', fr:'Français',  ar:'عربى',ru:'русский',pt:'português',ja:'日本語',id:'Bahasa Indonesia'}
    },
    es: {
        label : {
            yearplanner : 'Planificador anual',
            accept : 'Aceptar',
            cookies : 'Este sitio web utiliza cookies.',
            close:'Cerrar',
            update:'Actualizar',
            delete:'Borrar',
            share:'Compartir',
            sharecopy:'Comparte una copia',
            copy:'Copiar',
            text:'En este día …',
            created :'Creado',
            updated : 'Actualizado',
            none : 'Ninguno',
            rename : 'Rebautizar',untitled : 'Intitulado',
            month:'Mes',year:'Año',week:'Semana',semester:'Semestre',term:'Término',today:'Hoy',
            theme:'Tema',light:'Luz',dark:'Oscuro'
        },
        month : {
            January: 'enero', February: 'febrero', March : 'marzo', April:'abril', May:'mayo',June:'junio',July:'julio',August:'agosto',September:'septiembre',October:'octubre',November:'noviembre',December:'diciembre'
        },
        day :{
            Monday:'lunes',Tuesday:'martes',Wednesday:'miércoles',Thursday:'jueves',Friday:'viernes',Saturday:'sábado',Sunday:'domingo'
        },
    },
    pt: {
       label : {
            yearplanner : 'Planejador do ano',
            accept : 'Aceitar',
            cookies : 'Este site usa cookies.',
            close:'Fechar',
            update:'Atualizar',
            delete:'Excluir',
            share:'Ação',
            sharecopy:'Compartilhe uma cópia',
            copy:'Cópie',
            text:'Neste dia …',
            created:'Created',
            updated : 'Criado',
            none : 'Nenhum',
            rename : 'Renomear',untitled : 'Sem título',
            month:'Mês',year:'Ano',week:'Semana',semester:'Semestre',term:'Prazo',today:'Hoje',
           theme:'Tema',light:'Luz',dark:'Escuro'
        },
        month : {
            January: 'janeiro', February: 'fevereiro', March : 'marcha', April:'abril', May:'maio',June:'junho',July:'julho',August:'agosto',September:'setembro',October:'outubro',November:'novembro',December:'dezembro'
        },
        day :{
            Monday:'segunda-feira',Tuesday:'terça-feira',Wednesday:'quarta-feira',Thursday:'quinta-feira',Friday:'sexta-feira',Saturday:'sábado',Sunday:'domigo'
        },
    },

    zh:{
        label : {
            yearplanner : '年度策劃人',
            accept : '接受',
            cookies : '本網站使用cookie。',
            close:'關閉',
            update:'更新',
            delete:'刪除',
            share:'分享',
            sharecopy:'分享副本',
            copy:'复制',
            text:'在這一天 …',
            created:'已建立',
            updated : '更新',
            none : '沒有任何',
            rename : '改名',untitled : '無標題',
            month:'月',year:'年',week:'星期',semester:'學期',term:'學期',today:'今天',
            theme:'主題',light:'光',dark:'黑暗的'
        },
        month : {
            January: '一月', February: '二月', March : '行進', April:'四月', May:'可能',June:'六月',July:'七月',August:'八月',September:'九月',October:'十月',November:'十一月',December:'十二月'
        },
        day :{
            Monday:'週一',Tuesday:'週二',Wednesday:'週三',Thursday:'週四',Friday:'星期五',Saturday:'週六',Sunday:'星期日'
        },
    },
    hi:{
           label : {
            yearplanner : 'वर्ष नियोजक',
            accept : 'स्वीकार करना',
            cookies : 'यह वेबसाइट कुकीज़ का उपयोग करती है।',
            close:'बंद करे',
            update:'अपडेट करें',
            delete:'हटाएं',
            share:'शेयर',
            sharecopy:'एक प्रति साझा करें',
            copy:'कॉपी',
            text:'इस दिन …',
            created:'बनाया था',
            updated : 'अद्यतन',
            none : 'कोई नहीं',
            rename : 'नाम बदलें',untitled : 'शीर्षकहीन',
            month:'महीना',year:'साल',week:'सप्ताह',semester:'छमाही',term:'अवधि',today:'आज',
            theme:'विषय',light:'रोशनी',dark:'अंधेरा'
        },
        month : {
            January: 'जनवरी', February: 'फ़रवरी', March : 'जुलूस', April:'अप्रैल', May:'मई',June:'जून',July:'जुलाई',August:'अगस्त',September:'सितंबर',October:'अक्टूबर',November:'नवंबर',December:'दिसंबर'
        },
        day :{
            Monday:'सोमवार',Tuesday:'मंगलवार',Wednesday:'बुधवार',Thursday:'गुरूवार',Friday:'शुक्रवार',Saturday:'शनिवार',Sunday:'रविवार'
        },
    },
    fr:{
        label : {
            yearplanner : 'Planificateur d\'année',
            accept : 'J\'accepte',
            cookies : 'Ce site web utilise des cookies.',
            close:'Fermer',
            update:'Mettre à jour',
            delete:'Effacer',
            share:'Partager',
            sharecopy:'Partager une copie',
            copy:'Copiez',
            text:'Ce jour-là…',
            created:'Établi',
            updated : 'Actualisé',
            none : 'Rien',
            rename : 'Renommer',untitled : 'Sans titre',
            month:'Mois',year:'An',week:'Semaine',semester:'Semestre',term:'Terme',today:'Aujourd\'hui',
            theme:'Thème',light:'Lumière',dark:'Sombre'
        },
        month : {
            January: 'janvier', February: 'février', March : 'mars', April:'avril', May:'peut',June:'juin',July:'juillet',August:'août',September:'septembre',October:'octobre',November:'novembre',December:'décembre'
        },
        day :{
            Monday:'lundi',Tuesday:'mardi',Wednesday:'mercredi',Thursday:'jeudi',Friday:'vendredi',Saturday:'samedi',Sunday:'dimanche'
        },
    },
  ar:{
        label : {
            yearplanner : 'مخطط العام',
            accept : 'قبول',
            cookies : 'هذا الموقع يستخدم الكوكيز.',
            close:'يغلق',
            update:'تحديث',
            delete:'حذف',
            share:'يشارك',
            sharecopy:'مشاركة نسخة',
            copy:'انسخه',
            text:'في هذا اليوم …',
            created:'مخلوق',
            updated : 'محدث',
            none : 'لا أحد',
            rename : 'إعادة تسمية',untitled : 'بدون عنوان',
            month:'شهر',year:'سنة',week:'أسبوع',semester:'نصف السنة',term:'شرط',today:'اليوم',
            theme:'سمة',light:'ضوء',dark:'داكن'
        },
        month : {
            January: 'كانون الثاني', February: 'شهر فبراير', March : 'مارس', April:'أبريل', May:'يمكن',June:'يونيو',July:'يوليو',August:'شهر اغسطس',September:'سبتمبر',October:'اكتوبر',November:'شهر نوفمبر',December:'ديسمبر'
        },
        day :{
            Monday:'يوم الاثنين',Tuesday:'يوم الثلاثاء',Wednesday:'الأربعاء',Thursday:'يوم الخميس',Friday:'يوم الجمعة',Saturday:'يوم السبت',Sunday:'يوم الأحد'
        },
    },
    ru:{
       label : {
            yearplanner : 'Планировщик года',
            accept : 'Принимать',
            cookies : 'Этот веб-сайт использует файлы cookie.',
            close:'Закрывать',
            update:'Обновлять',
            delete:'Удалить',
            share:'Делиться',
            sharecopy:'Поделиться копией',
            copy:'Скопируйте',
            text:'В этот день …',
            created:'Созданный',
            updated : 'Обновлено',
            none : 'Никто',
            rename : 'Переименовать',untitled : 'Без названия',
            month:'Месяц',year:'Год',week:'Неделя',semester:'Семестр',term:'Срок',today:'Сегодня',
            theme:'Thème',light:'Lumière',dark:'Sombre'
        },
        month : {
            January: 'январь', February: 'февраль', March : 'марш', April:'апрель', May:'май',June:'июнь',July:'июль',August:'август',September:'сентябрь',October:'октябрь',November:'ноябрь',December:'Декабрь'
        },
        day :{
            Monday:'понедельник',Tuesday:'вторник',Wednesday:'среда',Thursday:'четверг',Friday:'Пятница',Saturday:'Суббота',Sunday:'воскресенье'
        },
    },
    ja:{
       label : {
            yearplanner : 'イヤープランナー',
            accept : '受け入れる',
            cookies : 'このウェブサイトはクッキーを使用しています。',
            close:'閉じる',
            update:'更新',
            delete:'削除',
            share:'共有',
            sharecopy:'コピーを共有する',
            copy:'コピー',
            text:'この日…',
            created:'作成した',
            updated : '更新しました',
            none : '無し',
            rename : '名前を変更',untitled : '無題',
            month:'月',year:'年',week:'週間',semester:'学期',term:'期間',today:'今日',
            theme:'テーマ',light:'光',dark:'闇'
        },
        month : {
            January: '一月', February: '二月', March : '三月', April:'四月', May:'五月',June:'六月',July:'七月',August:'八月',September:'九月',October:'十月',November:'十一月',December:'十二月'
        },
        day :{
            Monday:'月曜',Tuesday:'火曜日',Wednesday:'水曜日',Thursday:'木曜日',Friday:'金曜日',Saturday:'土曜日',Sunday:'日曜日'
        },
    },
    id:{
       label : {
            yearplanner : 'Perencana Tahun',
            accept : 'Menerima',
            cookies : 'Situs web ini menggunakan cookie.',
            close:'Menutup',
            update:'Memperbarui',
            delete:'Menghapus',
            share:'Bagikan',
            sharecopy:'Bagikan salinan',
            copy:'Salin',
            text:'Pada hari ini …',
            created:'Dibuat',
            updated : 'Diperbarui',
            none : 'Tidak ada',
            rename : 'Ganti nama',untitled : 'Tanpa judul',
            month:'Bulan',year:'Tahun',week:'Minggu',semester:'Semester',term:'Istilah',today:'Hari ini',
            theme:'Tema',light:'Cahaya',dark:'Gelap'
        },
        month : {
            January: 'Januari', February: 'Februari', March : 'Maret', April:'April', May:'Mungkin',June:'Juni',July:'Juli',August:'Agustus',September:'September',October:'Oktober',November:'November',December:'Desember'
        },
        day :{
            Monday:'Senin',Tuesday:'Selasa',Wednesday:'Rabu',Thursday:'Kamis',Friday:'Jumat',Saturday:'Sabtu',Sunday:'Minggu'
        }    },
}

var getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';

