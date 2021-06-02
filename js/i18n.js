
var messages = {
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
            entryplaceholder:'On this day …',
            created:'Created',
            updated : 'Updated',
            none : 'None',
            rename : 'Rename',untitled : 'Untitled',
            month:'Month',year:'Year',week:'Week',semester:'Semester',term:'Term',today:'Today',
            theme:'Theme',light:'Light',dark:'Dark',
            register: 'Register', username: 'Username', password : 'Password', email: 'Email', mobile :'Mobile',haveaccount:'Already have an account?',
            signin:  'Sign In', signout: 'Sign Out', rememberme: 'Keep me signed in',forgotpass :'Forgot my password', forgotuser : 'Forgot my username',noaccount:'Don\'t have an account?',
            settings: 'Settings…', profile: 'Profile', verify : 'Verify', verified : 'Verified', unverified : 'Unverified', changepass : 'Change Password', oldpassword : 'Old Password', newpassword : 'New Password',
            verifySubject: 'Year Planner: Email Verification', verifyBody: 'Please verify your email address by clicking the link below:\n\n\t',
            resetPassword: 'Reset Password', recoverPassSubject: 'Year Planner: Reset Password', recoverPassBody: 'Your reset Year Planner account password is:\n\n\t',
            recover:'Recover', recoverUsername: 'Recover Username', recoverUserSubject: 'Year Planner: Recover Username', recoverUserBody: 'Your Year Planner account name is:\n\n\t',
            donate: 'Donate', give :'Give AUD 1.00', donatespiel: 'A donation hides the Donate button for one year.', donationaccepted:'Donation Accepted.',donationreceipt:'Your donation receipt',
            donationSubject:'Planificador anual: recibo de donación',donationBody:'Gracias por su donación, su recibo se puede encontrar aquí\n\n\t',
            cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
    },
        success: {
            verifySent : 'A verification email has been sent.',
            recoverPassSent : 'A new password has been sent to your verified account email address.',
            recoverUserSent : 'Your username has been sent to your verified account email address.',
            usernamechanged : 'Username has been changed.',
            passwordchanged : 'Password has been changed.',
            emailchanged : 'Email has been changed. Click the send button to send a verification email.'
        },
        warn: {
            usernamenotprovided:'A username must be provided',
            passwordnotprovided:'A password must be provided',
            emailnotprovided:'An email address must be provided',
            mobilenotprovided:'A mobile number must be provided'
        },
        error: {
            general: 'An error occurred',
            apinotavailable: 'The remote year planner API is not available',
            usernotavailable: 'The username is not available',
            unauthorized: 'Username or password is not correct',
            passwordincorrect: 'Password is not correct',
            paymentfailed: 'Payment failed',
        },
        month : {
            January: 'January', February: 'February', March : 'March', April:'April', May:'May',June:'June',July:'July',August:'August',September:'September',October:'October',November:'November',December:'December'
        },
        day :{
            Monday:'Monday',Tuesday:'Tuesday',Wednesday:'Wednesday',Thursday:'Thursday',Friday:'Friday',Saturday:'Saturday',Sunday:'Sunday'
        },
        lang: {en:'English', zh:'中國人', hi:'हिन्दी', es:'español', fr:'Français',  ar:'عربى',ru:'русский',pt:'português',ja:'日本語',id:'Bahasa Indonesia',tp:'Tok Pisin'}
    },
    es: {
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
    },
    pt: {
       label : {
            yearplanner : 'Planejador do ano',
            accept : 'Aceitar',
            cookies : 'Este site usa cookies.',reset:'Redefinir',
            close:'Fechar',
            update:'Atualizar',
            new:'Novo',
            delete:'Excluir',deleteplanner:'Confirma a exclusão do planejador atual?',
            share:'Ação',
            sharecopy:'Compartilhe uma cópia',
            copy:'Cópie',
            entryplaceholder:'Neste dia …',
            created:'Created',
            updated : 'Criado',
            none : 'Nenhum',
            rename : 'Renomear',untitled : 'Sem título',
            month:'Mês',year:'Ano',week:'Semana',semester:'Semestre',term:'Prazo',today:'Hoje',
           theme:'Tema',light:'Luz',dark:'Escuro',
           register: 'Registro', username: 'Nome do usuário', password : 'Senha', email: 'E-mail', mobile :'Celular',haveaccount:'Já tem uma conta?',
           signin:  'Entrar', signout: 'Sair', rememberme: 'Mantenha-me conectado',forgotpass :'Esqueci minha senha', forgotuser : 'Esqueci meu nome de usuário',noaccount:'Não tem conta?',
           settings: 'Settings…', profile: 'Perfil', verify : 'Verificar', verified : 'Verificado', unverified : 'Não verificado', changepass : 'Alterar a senha', oldpassword : 'Senha Antiga', newpassword : 'Nova Senha',
           verifySubject: 'Planejador do ano: verificação de e-mail', verifyBody: 'Verifique o seu endereço de e-mail clicando no link abaixo:\n\n\t',
           resetPassword: 'Redefinir senha', recoverPassSubject: 'Planejador do ano: redefinir senha', recoverPassBody: 'A senha redefinida da sua conta do planejador anual é:\n\n\t',
           recover:'Recuperar', recoverUsername: 'Recuperar nome de usuário', recoverUserSubject: 'Planejador do ano: recuperar nome de usuário', recoverUserBody: 'O nome da sua conta do planejador anual é:\n\n\t',
           donate: 'Doar', give :'Dê AUD 1,00', donatespiel: 'Uma doação oculta o botão Doar por um ano.', donationaccepted:'Doação aceita.',donationreceipt:'Seu recibo de doação',
           donationSubject:'Planejador do ano: recibo de doação',donationBody:'Obrigado pela sua doação, o seu recibo pode ser encontrado aqui:\n\n\t',
           cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
        },
        success: {
            verifySent : 'Um e-mail de verificação foi enviado',
            recoverPassSent : 'Uma nova senha foi enviada para o endereço de e-mail da sua conta verificada',
            recoverUserSent : 'Seu nome de usuário foi enviado para o endereço de e-mail verificado da sua conta',
            usernamechanged : 'O nome de usuário foi alterado',
            passwordchanged : 'A senha foi alterada',
            emailchanged : 'Email foi alterado. Clique no botão enviar para enviar um e-mail de verificação'
        },
        warn: {
            usernamenotprovided:'Um nome de usuário deve ser fornecido',
            passwordnotprovided:'Uma senha deve ser fornecida'
        },
        error: {
            apinotavailable: 'A API do planejador anual remoto não está disponível',
            usernotavailable: 'O nome de usuário não está disponível',
            unauthorized: 'Nome de usuário ou senha incorretos',
            passwordincorrect: 'Senha incorreta',
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
            cookies : '本網站使用cookie。',reset:'重啟',
            close:'關閉',
            update:'更新',
            new:'新的',
            delete:'刪除',deleteplanner:'確認刪除當前的計劃者？',
            share:'分享',
            sharecopy:'分享副本',
            copy:'复制',
            entryplaceholder:'在這一天 …',
            created:'已建立',
            updated : '更新',
            none : '沒有任何',
            rename : '改名',untitled : '無標題',
            month:'月',year:'年',week:'星期',semester:'學期',term:'學期',today:'今天',
            theme:'主題',light:'光',dark:'黑暗的',
            register: '登記', username: '用戶名', password : '密碼', email: '電子郵件', mobile :'手機',haveaccount:'已經有帳號了',
            signin:  '登入', signout: '登出', rememberme: '保持登錄狀態',forgotpass :'忘了我的密碼', forgotuser : '忘記我的用戶名',noaccount:'還沒有帳號',
            settings: 'Settings…', profile: '輪廓', verify : '核實', verified : '已驗證', unverified : '未驗證', changepass : '更改密碼', oldpassword : '舊密碼', newpassword : '新密碼',
            verifySubject: '年計劃電子郵件驗證', verifyBody: '請通過點擊以下鏈接來驗證您的電子郵件地址\n\n\t',
            resetPassword: '重設密碼', recoverPassSubject: '年計劃員重置密碼', recoverPassBody: '您的重置年計劃者帳戶密碼為\n\n\t',
            recover:'恢復', recoverUsername: '恢復用戶名', recoverUserSubject: '年計劃員恢復用戶名', recoverUserBody: '您的年度計劃者帳戶名稱為\n\n\t',
            donate: '捐', give :'贈送1.00澳元', donatespiel: '捐贈會將“捐贈”按鈕隱藏一年', donationaccepted:'接受捐款',donationreceipt:'您的捐贈收據',
            donationSubject:'年度策劃人捐贈收據',donationBody:'謝謝您的捐款您可以在這裡找到收據\n\n\t',
            cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
        },
        success: {
            verifySent : '驗證郵件已發送',
            recoverPassSent : '新密碼已發送到您已驗證的帳戶電子郵件地址',
            recoverUserSent : '您的用戶名已發送到您已驗證的帳戶電子郵件地址',
            usernamechanged : '用戶名已更改',
            passwordchanged : '密碼已被更改',
            emailchanged : '電子郵件已被更改。點擊發送按鈕發送驗證郵件'
        },
        warn: {
            usernamenotprovided:'必須提供用戶名',
            passwordnotprovided:'必須提供密碼',
            passwordincorrect: '密碼不正確',
        },
        error: {
            apinotavailable: '遠程年計劃器API不可用',
            usernotavailable: '用戶名不可用',
            unauthorized: '用戶名或密碼不正確'
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
    },
    fr:{
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
    },
  ar:{
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
    },
    ru:{
       label : {
            yearplanner : 'Планировщик года',
            accept : 'Принимать',
            cookies : 'Этот веб-сайт использует файлы cookie.',reset:'Сброс настроек',
            close:'Закрывать',
            update:'Обновлять',
            new:'Новый',
            delete:'Удалить',deleteplanner:'Подтвердить удаление текущего планировщика?',
            share:'Делиться',
            sharecopy:'Поделиться копией',
            copy:'Скопируйте',
            entryplaceholder:'В этот день …',
            created:'Созданный',
            updated : 'Обновлено',
            none : 'Никто',
            rename : 'Переименовать',untitled : 'Без названия',
            month:'Месяц',year:'Год',week:'Неделя',semester:'Семестр',term:'Срок',today:'Сегодня',
            theme:'Тема',light:'Свет',dark:'Темный',
            register: 'регистр', username: 'Имя пользователя', password : 'Пароль', email: 'Электронное письмо', mobile :'Мобильный',haveaccount:'Уже есть аккаунт?',
            signin:  'Войти', signout: 'Выход', rememberme: 'Держать меня в системе',forgotpass :'Забыл мой пароль', forgotuser : 'Я забыл свое имя пользователя',noaccount:'Нет учетной записи?',
           settings: 'Settings…', profile: 'Профиль', verify : 'Проверять', verified : 'Проверено', unverified : 'Непроверенный', changepass : 'Измени пароль', oldpassword : 'Прежний пароль', newpassword : 'Новый пароль',
           verifySubject: 'Планировщик года: подтверждение адреса электронной почты', verifyBody: 'Подтвердите свой адрес электронной почты, щелкнув ссылку ниже:\n\n\t',
           resetPassword: 'Сброс пароля', recoverPassSubject: 'Планировщик года сбросить пароль', recoverPassBody: 'Пароль вашей учетной записи планировщика на год для сброса\n\n\t',
           recover:'Восстанавливаться', recoverUsername: 'Восстановить имя пользователя', recoverUserSubject: 'Планировщик года восстановить имя пользователя', recoverUserBody: 'Имя вашей учетной записи планировщика года\n\n\t',
           donate: 'Пожертвовать', give :'Дайте 1 австралийский доллар', donatespiel: 'Пожертвование скрывает кнопку «Пожертвовать» на один год.', donationaccepted:'Пожертвование принято.',donationreceipt:'Квитанция о пожертвовании',
           donationSubject:'Планировщик года: квитанция о пожертвовании',donationBody:'Спасибо за пожертвование, квитанцию ​​можно найти здесь:\n\n\t',
           cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
       },
        success: {
            verifySent : 'Письмо с подтверждением отправлено',
            recoverPassSent : 'На ваш подтвержденный адрес электронной почты был отправлен новый пароль',
            recoverUserSent : 'Ваше имя пользователя было отправлено на адрес электронной почты вашего подтвержденного аккаунта',
            usernamechanged : 'Имя пользователя было изменено',
            passwordchanged : 'пароль был изменен',
            emailchanged : 'Электронная почта была изменена. Нажмите кнопку «Отправить», чтобы отправить письмо с подтверждением'
        },
        warn: {
            usernamenotprovided:'Необходимо указать имя пользователя',
            passwordnotprovided:'Необходимо указать пароль'
        },
        error: {
            apinotavailable: 'API удаленного планировщика года недоступен',
            usernotavailable: 'Имя пользователя недоступно',
            unauthorized: 'Имя пользователя или пароль неверны',
            passwordincorrect: 'Пароль неверный',
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
            cookies : 'このウェブサイトはクッキーを使用しています。',reset:'リセット',
            close:'閉じる',
            update:'更新',
            new:'新着',
            delete:'削除',deleteplanner:'現在のプランナーの削除を確認しますか？',
            share:'共有',
            sharecopy:'コピーを共有する',
            copy:'コピー',
            entryplaceholder:'この日…',
            created:'作成した',
            updated : '更新しました',
            none : '無し',
            rename : '名前を変更',untitled : '無題',
            month:'月',year:'年',week:'週間',semester:'学期',term:'期間',today:'今日',
            theme:'テーマ',light:'光',dark:'闇',
            register: '登録', username: 'ユーザー名', password : 'パスワード', email: 'Eメール', mobile :'携帯電話',haveaccount:'すでにアカウントをお持ちですか',
            signin:  'サインイン', signout: 'サインアウト', rememberme: 'ログイン状態を保持する',forgotpass :'自分のパスワードを忘れてしまいました', forgotuser : 'ユーザー名を忘れた',noaccount:'アカウントをお持ちではありませんか',
           settings: 'Settings…', profile: 'プロフィール', verify : '確認', verified : '確認済み', unverified : '未確認', changepass : 'パスワードを変更する', oldpassword : '以前のパスワード', newpassword : '新しいパスワード',
           verifySubject: 'イヤープランナーメール検証', verifyBody: '以下のリンクをクリックして、メールアドレスを確認してください。\n\n\t',
           resetPassword: 'パスワードを再設定する', recoverPassSubject: 'イヤープランナーパスワードをリセット', recoverPassBody: 'リセットされたイヤープランナーアカウントのパスワードは\n\n\t',
           recover:'回復します', recoverUsername: 'ユーザー名を回復する', recoverUserSubject: 'イヤープランナーユーザー名を回復する', recoverUserBody: 'イヤープランナーのアカウント名は\n\n\t',
           donate: '寄付', give :'1.00豪ドルを与える', donatespiel: '寄付は1年間[寄付]ボタンを非表示にします', donationaccepted:'寄付を受け付けました',donationreceipt:'寄付の領収書',
           donationSubject:'イヤープランナー寄付の領収書',donationBody:'寄付ありがとうございます。領収書はこちらにあります:\n\n\t',
           cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
       },
        success: {
            verifySent : '確認メールが送信されました',
            recoverPassSent : '確認済みのアカウントのメールアドレスに新しいパスワードが送信されました',
            recoverUserSent : 'ユーザー名が確認済みのアカウントのメールアドレスに送信されました',
            usernamechanged : 'ユーザー名が変更されました',
            passwordchanged : 'パスワードが変更されました',
            emailchanged : 'メールが変更されました。送信ボタンをクリックして、確認メールを送信します'
        },
        warn: {
            usernamenotprovided:'ユーザー名を指定する必要があります',
            passwordnotprovided:'パスワードを入力する必要があります'
        },
        error: {
            apinotavailable: 'リモートイヤープランナーAPIは利用できません',
            usernotavailable: 'ユーザー名は利用できません',
            unauthorized: 'ユーザー名またはパスワードが正しくありません',
            passwordincorrect: 'パスワードが正しくありません',
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
            cookies : 'Situs web ini menggunakan cookie.',reset:'Reset',
            close:'Menutup',
            update:'Memperbarui',
            new:'New',
            delete:'Menghapus',deleteplanner:'Confirm delete of the current planner?',
            share:'Bagikan',
            sharecopy:'Bagikan salinan',
            copy:'Salin',
            entryplaceholder:'Pada hari ini …',
            created:'Dibuat',
            updated : 'Diperbarui',
            none : 'Tidak ada',
            rename : 'Ganti nama',untitled : 'Tanpa judul',
            month:'Bulan',year:'Tahun',week:'Minggu',semester:'Semester',term:'Istilah',today:'Hari ini',
            theme:'Tema',light:'Cahaya',dark:'Gelap',
            register: 'Daftar', username: 'Nama pengguna', password : 'Kata sandi', email: 'Surel', mobile :'Telepon genggam',haveaccount:'Sudah memiliki akun?',
            signin:  'Masuk', signout: 'Keluar', rememberme: 'Biarkan saya tetap masuk',forgotpass :'Lupa kata sandi ku', forgotuser : 'Lupa nama pengguna saya',noaccount:'Belum punya akun?',
           settings: 'Settings…', profile: 'Profil', verify : 'Memeriksa', verified : 'Diverifikasi', unverified : 'Tidak diverifikasi', changepass : 'Ganti kata sandi', oldpassword : 'Kata sandi baru', newpassword : 'Kata sandi lama',
           verifySubject: 'Perencana Tahun: Verifikasi Email', verifyBody: 'Harap verifikasi alamat email Anda dengan mengklik link di bawah ini:\n\n\t',
           resetPassword: 'Atur Ulang Kata Sandi', recoverPassSubject: 'Perencana Tahun: Atur Ulang Kata Sandi', recoverPassBody: 'Kata sandi akun perencana tahun penyetelan ulang Anda adalah:\n\n\t',
           recover:'Memulihkan', recoverUsername: 'Pulihkan Nama Pengguna', recoverUserSubject: 'Perencana Tahun: Pulihkan Nama Pengguna', recoverUserBody: 'Nama akun perencana tahun Anda adalah\n\n\t',
           donate: 'Menyumbangkan', give :'Memberikan AUD 1,00', donatespiel: 'Donasi menyembunyikan tombol Donasi selama satu tahun.', donationaccepted:'Donasi Diterima.',donationreceipt:'Tanda terima donasi Anda',
           donationSubject:'Perencana Tahun: Tanda Terima Donasi',donationBody:'Terima kasih atas donasi Anda, tanda terima Anda dapat ditemukan di sini:\n\n\t',
           cardnumber:'Card Number', mmyy:'MM/YY', cvv:'CVV', postalcode:'Postal Code'
       },
        success: {
            verifySent : 'Email verifikasi telah dikirim',
            recoverPassSent : 'Kata sandi baru telah dikirim ke alamat email akun terverifikasi Anda',
            recoverUserSent : 'Nama pengguna Anda telah dikirim ke alamat email akun terverifikasi Anda',
            usernamechanged : 'Nama pengguna telah diubah',
            passwordchanged : 'Kata sandi telah diubah',
            emailchanged : 'Email telah diubah. Klik tombol kirim untuk mengirim email verifikasi'
        },
        warn: {
            usernamenotprovided:'Nama pengguna harus diberikan',
            passwordnotprovided:'Kata sandi harus diberikan'
        },
        error: {
            apinotavailable: 'API perencana tahun jarak jauh tidak tersedia',
            usernotavailable: 'Nama pengguna tidak tersedia',
            unauthorized: 'Nama pengguna atau kata sandi salah',
            passwordincorrect: 'Kata sandi salah',
        },
        month : {
            January: 'Januari', February: 'Februari', March : 'Maret', April:'April', May:'Mungkin',June:'Juni',July:'Juli',August:'Agustus',September:'September',October:'Oktober',November:'November',December:'Desember'
        },
        day :{
            Monday:'Senin',Tuesday:'Selasa',Wednesday:'Rabu',Thursday:'Kamis',Friday:'Jumat',Saturday:'Sabtu',Sunday:'Minggu'
        }    },
    tp: {
        label : {
            yearplanner : 'Toktok bilong yia',
            accept : 'Kisim',
            cookies : 'Dispela sait yusim switbiskit bilong kompyuta.',reset:'Rausim pinis',
            close:'Pas',
            update:'Savim',
            new:'Nupela',
            delete:'Rausim', deleteplanner:'Ruasim dispela yia?',
            share:'Dilim',
            sharecopy:'Dilim olsem narapela',
            copy:'Narapela ',
            entryplaceholder:'Onim dispela de …',
            created:'Ol mekim hap',
            updated : 'Ol savim hap',
            none : 'Nogat samting',
            rename : 'Senisim nem',untitled : 'Nogat nem',
            month:'Mun',year:'Yia',week:'Wik',semester:'Semester',term:'Term',today:'Tude',
            theme:'Kala',light:'Wait',dark:'Bilak',
            register: 'Givim nem', username: 'Nem bilong yusim', password : 'Haitim wod', email: 'E-mel', mobile :'Telefon',haveaccount:'Ol yusim behain?',
            signin:  'Mak hia', signout: 'Mak stap', rememberme: 'Kisim mi mak hia',forgotpass :'Lusim ol wod bilong hait', forgotuser : 'Lusim ol wod bilong yusim',noaccount:'No yusim behain?',
            settings: 'Putim ol samting…', profile: 'Pes', verify : 'Truim', verified : 'Ol truim', unverified : 'Truim nogut', changepass : 'Senisim wod bilong hait', oldpassword : 'wod bilong hait long behain', newpassword : 'Nupela wod bilong hait',
            verifySubject: 'Toktok bilong yia: E-mel Truim', verifyBody: 'Plis truim e-mel bilong yiu:\n\n\t',
            resetPassword: 'Reset Password', recoverPassSubject: 'Year Planner: Reset Password', recoverPassBody: 'Your reset Year Planner account password is:\n\n\t',
            recover:'Recover', recoverUsername: 'Recover Username', recoverUserSubject: 'Year Planner: Recover Username', recoverUserBody: 'Your Year Planner account name is:\n\n\t',
            donate: 'Givim ol mani'
        },
        success: {
            verifySent : 'A verification email has been sent.',
            recoverPassSent : 'A new password has been sent to your verified account email address.',
            recoverUserSent : 'Your username has been sent to your verified account email address.',
            usernamechanged : 'Username has been changed.',
            passwordchanged : 'Password has been changed.',
            emailchanged : 'Email has been changed. Click the send button to send a verification email.'
        },
        warn: {
            usernamenotprovided:'Mas givim nem bilong yusim',
            passwordnotprovided:'Mas givim haitim wod'
        },
        error: {
            apinotavailable: 'Ol API toktok bilong yia API no stap long hap',
            usernotavailable: 'Nem bilong yusim ol bilong sam narapela',
            unauthorized: 'Ol nem bilong yusim na hait wod emi nogut'
        },
        month : {
            January: 'Jenueri', February: 'Februeri', March : 'Mars', April:'Epril', May:'Me',June:'Jun',July:'Julai',August:'Ogas',September:'Septemba',October:'Oktoba',November:'Novemba',December:'Disemba'
        },
        day :{
            Monday:'Mande',Tuesday:'Tunde',Wednesday:'Trinde',Thursday:'Fonde',Friday:'Fraide',Saturday:'Sarere',Sunday:'Sande'
        },
    },
}

var getNavigatorLanguage = () => (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';

var i18n = new VueI18n({
    locale: (urlParam('lang') || 'en').substring(0,2), // set locale
    fallbackLocale: 'en',
    messages, // set locale messages
});
