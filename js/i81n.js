const messages = {
    en: {
        label : {
            yearplanner : 'Year Planner',
            accept : 'Accept',
            cookies : 'This website uses cookies.',
            close:'Close',
            update:'Update',
            share:'Share',
            sharecopy:'Share a copy',
            copy:'Copy',
            text:'On this day …',
            created:'Created',
            updated : 'Updated',
            none : 'None'
        },
        month : {
            January: 'January', February: 'February', March : 'March', April:'April', May:'May',June:'June',July:'July',August:'August',September:'September',October:'October',November:'November',December:'December'
        },
        day :{
            Monday:'Monday',Tuesday:'Tuesday',Wednesday:'Wednesday',Thursday:'Thursday',Friday:'Friday',Saturday:'Saturday',Sunday:'Sunday'
        },

        lang: {en:'English', zh:'中國人', hi:'हिन्दी', es:'español', fr:'Français',  ar:'عربى',ru:'русский',pt:'português',ja:'日本語',id:'bahasa Indonesia'}
    },
    es: {
        label : {
            yearplanner : 'Planificador anual',
            accept : 'Aceptar',
            cookies : 'Este sitio web utiliza cookies.',
            close:'Cerrar',
            update:'Actualizar',
            share:'Compartir',
            sharecopy:'Comparte una copia',
            copy:'Copiar',
            text:'En este día …',
            created :'Creado',
            updated : 'Actualizado',
            none : 'Ninguno'
        },
        month : {
            January: 'enero', February: 'febrero', March : 'marzo', April:'abril', May:'mayo',June:'junio',July:'julio',August:'agosto',September:'septiembre',October:'octubre',November:'noviembre',December:'diciembre'
        },
        day :{
            Monday:'lunes',Tuesday:'martes',Wednesday:'miércoles',Thursday:'jueves',Friday:'viernes',Saturday:'sábado',Sunday:'domingo'
        },
    },
    pt: {
       month : {
            January: 'janeiro', February: 'fevereiro', March : 'marcha', April:'abril', May:'maio',June:'junho',July:'julho',August:'agosto',September:'setembro',October:'outubro',November:'novembro',December:'dezembro'
        },
        day :{
            Monday:'segunda-feira',Tuesday:'terça-feira',Wednesday:'quarta-feira',Thursday:'quinta-feira',Friday:'sexta-feira',Saturday:'sábado',Sunday:'domigo'
        },
    },
    zh:{
        month : {
            January: '一月', February: '二月', March : '行進', April:'四月', May:'可能',June:'六月',July:'七月',August:'八月',September:'九月',October:'十月',November:'十一月',December:'十二月'
        },
        day :{
            Monday:'週一',Tuesday:'週二',Wednesday:'週三',Thursday:'週四',Friday:'星期五',Saturday:'週六',Sunday:'星期日'
        },
    },
    hi:{
        month : {
            January: 'जनवरी', February: 'फ़रवरी', March : 'जुलूस', April:'अप्रैल', May:'मई',June:'जून',July:'जुलाई',August:'अगस्त',September:'सितंबर',October:'अक्टूबर',November:'नवंबर',December:'दिसंबर'
        },
        day :{
            Monday:'सोमवार',Tuesday:'मंगलवार',Wednesday:'बुधवार',Thursday:'गुरूवार',Friday:'शुक्रवार',Saturday:'शनिवार',Sunday:'रविवार'
        },
    },
    fr:{
        month : {
            January: 'janvier', February: 'février', March : 'mars', April:'avril', May:'peut',June:'juin',July:'juillet',August:'août',September:'septembre',October:'octobre',November:'novembre',December:'décembre'
        },
        day :{
            Monday:'lundi',Tuesday:'mardi',Wednesday:'mercredi',Thursday:'jeudi',Friday:'vendredi',Saturday:'samedi',Sunday:'dimanche'
        },
    },
    ar:{
        month : {
            January: 'كانون الثاني', February: 'شهر فبراير', March : 'مارس', April:'أبريل', May:'يمكن',June:'يونيو',July:'يوليو',August:'شهر اغسطس',September:'سبتمبر',October:'اكتوبر',November:'شهر نوفمبر',December:'ديسمبر'
        },
        day :{
            Monday:'يوم الاثنين',Tuesday:'يوم الثلاثاء',Wednesday:'الأربعاء',Thursday:'يوم الخميس',Friday:'يوم الجمعة',Saturday:'يوم السبت',Sunday:'يوم الأحد'
        },
    },
    ru:{
        month : {
            January: 'январь', February: 'февраль', March : 'марш', April:'апрель', May:'май',June:'июнь',July:'июль',August:'август',September:'сентябрь',October:'октябрь',November:'ноябрь',December:'Декабрь'
        },
        day :{
            Monday:'понедельник',Tuesday:'вторник',Wednesday:'среда',Thursday:'четверг',Friday:'Пятница',Saturday:'Суббота',Sunday:'воскресенье'
        },
    },
    ja:{
        month : {
            January: '一月', February: '二月', March : '三月', April:'四月', May:'五月',June:'六月',July:'七月',August:'八月',September:'九月',October:'十月',November:'十一月',December:'十二月'
        },
        day :{
            Monday:'月曜',Tuesday:'火曜日',Wednesday:'水曜日',Thursday:'木曜日',Friday:'金曜日',Saturday:'土曜日',Sunday:'日曜日'
        },
    },
    id:{
        month : {
            January: 'Januari', February: 'Februari', March : 'Maret', April:'April', May:'Mungkin',June:'Juni',July:'Juli',August:'Agustus',September:'September',October:'Oktober',November:'November',December:'Desember'
        },
        day :{
            Monday:'Senin',Tuesday:'Selasa',Wednesday:'Rabu',Thursday:'Kamis',Friday:'Jumat',Saturday:'Sabtu',Sunday:'Minggu'
        },
    },
}
/*
DateTime.now().setLocale('ja').toLocaleString({day:'numeric'})
"5日"
DateTime.now().setLocale('ja').toLocaleString({year:'numeric'})

DateTime.local(2017, 5, 15, 8, 30);
DateTime.local(2017, 5, 15).setLocale('ja').toLocaleString({year:'numeric'});
"2017年"
DateTime.local(2017, 5, 15).setLocale('ja').toLocaleString({month:'long'});
"5月"
DateTime.local(2017, 5, 15).setLocale('ja').toLocaleString({month:'numeric'});
"5月"
DateTime.local(2017, 5, 15).setLocale('ar').toLocaleString({month:'numeric'});
"5"
DateTime.local(2017, 5, 15).setLocale('ar').toLocaleString({month:'long'});
"مايو"
*/
const getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';

