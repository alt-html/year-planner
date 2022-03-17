// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
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
    lang : lang
}
