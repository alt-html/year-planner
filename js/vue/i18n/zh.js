// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
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
    lang: lang
}
