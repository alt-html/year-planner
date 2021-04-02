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
        }

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
        }
    }
}

const getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';

