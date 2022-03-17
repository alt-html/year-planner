// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
    label : {
        yearplanner : 'Planificador anual',
        accept : 'Aceptar',
        cookies : 'Este sitio web utiliza cookies.',reset:'Reiniciar',
        close:'Cerrar',
        update:'Actualizar',
        new:'Nuevo',
        delete:'Borrar',deleteplanner:'¿Confirmar la eliminación del planificador actual?',
        share:'Compartir',
        sharecopy:'Comparte una copia',
        copy:'Copiar',
        entryplaceholder:'En este día …',
        created :'Creado',
        updated : 'Actualizado',
        none : 'Ninguno',
        rename : 'Rebautizar',untitled : 'Intitulado',
        month:'Mes',year:'Año',week:'Semana',semester:'Semestre',term:'Término',today:'Hoy',
        theme:'Tema',light:'Luz',dark:'Oscuro',
        register: 'Registrarse', username: 'Nombre de usuario', password : 'Contraseña', email: 'Correo electrónico', mobile :'Móvil',haveaccount:'¿Ya tienes una cuenta?',
        signin:  'Iniciar sesión', signout: 'Desconectar', rememberme: 'Mantenerme registrado',forgotpass :'Olvidé mi contraseña', forgotuser : 'Olvidé mi nombre de usuario',noaccount:'¿No tienes una cuenta?',
        settings: 'Settings…', profile: 'Perfil', verify : 'Verificar', verified : 'Verificado', unverified : 'Inconfirmado', changepass : 'Cambiar la contraseña', oldpassword : 'Contraseña anterior', newpassword : 'Nueva contraseña',
        verifySubject: 'Planificador anual: verificación por correo electrónico', verifyBody: 'Verifique su dirección de correo electrónico haciendo clic en el enlace siguiente:\n\n\t',
        resetPassword: 'Restablecer la contraseña', recoverPassSubject: 'Planificador anual: restablecer contraseña', recoverPassBody: 'Su contraseña de cuenta de Year Planner restablecida es:\n\n\t',
        recover:'Recuperar', recoverUsername: 'Recuperar nombre de usuario', recoverUserSubject: 'Planificador anual: recuperar nombre de usuario', recoverUserBody: 'El nombre de su cuenta del planificador anual es:\n\n\t',
        donate: 'Donar', give :'Dar 1,00 AUD', donatespiel: 'Una donación oculta el botón Donar durante un año.', donationaccepted:'Donación aceptada.',donationreceipt:'Tu recibo de donación',
        donationSubject:'Year Planner: Donation Receipt',donationBody:'Thanks you for your donation, your receipt can be found here:\n\n\t',
        cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
    },
    success: {
        verifySent : 'Se ha enviado un correo electrónico de verificación',
        recoverPassSent : 'Se ha enviado una nueva contraseña a la dirección de correo electrónico de su cuenta verificada',
        recoverUserSent : 'Su nombre de usuario ha sido enviado a la dirección de correo electrónico de su cuenta verificada',
        usernamechanged : 'Se ha cambiado el nombre de usuario',
        passwordchanged : 'La contraseña ha sido cambiada',
        emailchanged : 'Se ha cambiado el correo electrónico. Haga clic en el botón enviar para enviar un correo electrónico de verificación'
    },
    warn: {
        usernamenotprovided:'Debe proporcionarse un nombre de usuario',
        passwordnotprovided:'Se debe proporcionar una contraseña'
    },
    error: {
        apinotavailable: 'La API del planificador anual remoto no está disponible',
        usernotavailable: 'El nombre de usuario no está disponible',
        unauthorized: 'El nombre de usuario o la contraseña no son correctos',
        passwordincorrect: 'La contraseña no es correcta',
    },
    month : {
        January: 'enero', February: 'febrero', March : 'marzo', April:'abril', May:'mayo',June:'junio',July:'julio',August:'agosto',September:'septiembre',October:'octubre',November:'noviembre',December:'diciembre'
    },
    day :{
        Monday:'lunes',Tuesday:'martes',Wednesday:'miércoles',Thursday:'jueves',Friday:'viernes',Saturday:'sábado',Sunday:'domingo'
    },
    lang: lang
}
