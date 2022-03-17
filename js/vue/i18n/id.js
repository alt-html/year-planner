// import day from './en/day.js'
// import month from './en/month.js'
import lang from './lang.js'

export default {
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
    },
    lang: lang
}
