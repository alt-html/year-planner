// .tests/globalTeardown.js
const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
    const pidFile = path.join(__dirname, '.server-pid');
    if (fs.existsSync(pidFile)) {
        const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
        try { process.kill(pid, 'SIGTERM'); } catch (e) { /* already dead */ }
        fs.unlinkSync(pidFile);
        console.log(`[globalTeardown] run-local.js stopped (PID: ${pid})`);
    }
};
