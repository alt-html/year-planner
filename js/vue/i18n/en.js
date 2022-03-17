import day from './en/day.js'
import month from './en/month.js'
import lang from './lang.js'

export default {
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
    month : month,
    day : day,
    lang: lang
}
