// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
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
    lang: lang
}
