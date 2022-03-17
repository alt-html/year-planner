// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
    label : {
        yearplanner : 'Planificateur d\'année',
        accept : 'J\'accepte',
        cookies : 'Ce site web utilise des cookies.',reset:'Réinitialiser',
        close:'Fermer',
        update:'Mettre à jour',
        new:'Nouveau',
        delete:'Effacer',deleteplanner:'Confirmer la suppression du planning actuel?',
        share:'Partager',
        sharecopy:'Partager une copie',
        copy:'Copiez',
        entryplaceholder:'Ce jour-là…',
        created:'Établi',
        updated : 'Actualisé',
        none : 'Rien',
        rename : 'Renommer',untitled : 'Sans titre',
        month:'Mois',year:'An',week:'Semaine',semester:'Semestre',term:'Terme',today:'Aujourd\'hui',
        theme:'Thème',light:'Lumière',dark:'Sombre',
        register: 'S\'inscrire', username: 'Nom d\'utilisateur', password : 'Mot de passe', email: 'E-mail', mobile :'Mobile',haveaccount:'Vous avez déjà un compte?',
        signin:  'S\'identifier', signout: 'Se déconnecter', rememberme: 'Gardez-moi connecté',forgotpass :'J\'ai oublié mon mot de passe', forgotuser : 'J\'ai oublié mon nom d\'utilisateur',noaccount:'Vous n\'avez pas de compte?',
        settings: 'Settings…', profile: 'Profil', verify : 'Vérifier', verified : 'Vérifié', unverified : 'Non vérifié', changepass : 'Changer le mot de passe', oldpassword : 'Ancien mot de passe', newpassword : 'Nouveau mot de passe',
        verifySubject: 'Planificateur annuel: vérification des e-mails', verifyBody: 'Veuillez vérifier votre adresse e-mail en cliquant sur le lien ci-dessous:\n\n\t',
        resetPassword: 'Réinitialiser le mot de passe', recoverPassSubject: 'Planificateur annuel: réinitialiser le mot de passe', recoverPassBody: 'Le mot de passe de votre compte de planificateur d\'année de réinitialisation est:\n\n\t',
        recover:'Se remettre', recoverUsername: 'Récupérer le nom d\'utilisateur', recoverUserSubject: 'Planificateur d\'année: récupérer le nom d\'utilisateur', recoverUserBody: 'Le nom de votre compte de planificateur annuel est:\n\n\t',
        donate: 'Faire un don', give :'Donner 1,00 AUD', donatespiel: 'Un don masque le bouton Faire un don pendant un an.', donationaccepted:'Don accepté.',donationreceipt:'Votre reçu de don',
        donationSubject:'Planificateur d\'année: Reçu de don',donationBody:'Merci pour votre don votre reçu peut être trouvé ici:\n\n\t',
        cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
    },
    success: {
        verifySent : 'Un e-mail de vérification a été envoyé',
        recoverPassSent : 'Un nouveau mot de passe a été envoyé à l\'adresse e-mail de votre compte vérifié',
        recoverUserSent : 'Votre nom d\'utilisateur a été envoyé à l\'adresse e-mail de votre compte vérifié',
        usernamechanged : 'Le nom d\'utilisateur a été modifié',
        passwordchanged : 'Le mot de passe a été changé',
        emailchanged : 'L\'adresse e-mail a été modifiée. Cliquez sur le bouton d\'envoi pour envoyer un e-mail de vérification'
    },
    warn: {
        usernamenotprovided:'Un nom d\'utilisateur doit être fourni',
        passwordnotprovided:'Un mot de passe doit être fourni'
    },
    error: {
        apinotavailable: 'L\'API du planificateur d\'année à distance n\'est pas disponible',
        usernotavailable: 'Le nom d\'utilisateur n\'est pas disponible',
        unauthorized: 'Le nom d\'utilisateur ou le mot de passe n\'est pas correct',
        passwordincorrect: 'Le mot de passe n\'est pas correct',
    },
    month : {
        January: 'janvier', February: 'février', March : 'mars', April:'avril', May:'peut',June:'juin',July:'juillet',August:'août',September:'septembre',October:'octobre',November:'novembre',December:'décembre'
    },
    day :{
        Monday:'lundi',Tuesday:'mardi',Wednesday:'mercredi',Thursday:'jeudi',Friday:'vendredi',Saturday:'samedi',Sunday:'dimanche'
    },
    lang: lang
}
