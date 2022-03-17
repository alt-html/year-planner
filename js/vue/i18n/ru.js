// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
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
    lang: lang
}
