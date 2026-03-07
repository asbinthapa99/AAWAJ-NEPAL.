#!/usr/bin/env node
const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');
const os = require('os');

// Get local IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

const ip = getLocalIP();
const port = 3000;
const url = `http://${ip}:${port}`;

console.clear();
console.log('\x1b[36m%s\x1b[0m', '▶  Starting GuffGaff / Awaaz Nepal...\n');

qrcode.generate(url, { small: true }, (qr) => {
    console.log(qr);
    console.log('\x1b[1m  Scan the QR code above to open on your phone\x1b[0m');
    console.log('\x1b[2m  Make sure your phone is on the same Wi-Fi\x1b[0m\n');
    console.log('\x1b[32m  ›  Local:   \x1b[0mhttp://localhost:' + port);
    console.log('\x1b[32m  ›  Network: \x1b[0m' + url);
    console.log('\n\x1b[2m  Press Ctrl+C to stop\x1b[0m\n');
    console.log('\x1b[90m─────────────────────────────────────────\x1b[0m\n');

    // Start Next.js dev server
    const next = spawn('npx', ['next', 'dev', '-H', '0.0.0.0', '-p', String(port)], {
        stdio: 'inherit',
        shell: true,
    });

    next.on('close', (code) => process.exit(code));
});
