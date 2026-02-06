const path = require('path');
const fs = require('fs');

const srcDir = path.join(__dirname, 'src');
const uploadsDir = path.join(srcDir, '../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

console.log('--- Path Debug ---');
console.log('__dirname:', __dirname);
console.log('srcDir (simulated):', srcDir);
console.log('uploadsDir (resolved):', uploadsDir);

if (fs.existsSync(uploadsDir)) {
    console.log('✅ Uploads directory exists.');
    if (fs.existsSync(profilesDir)) {
        console.log('✅ Profiles directory exists.');
        const files = fs.readdirSync(profilesDir);
        console.log('Files in profiles:', files);
    } else {
        console.log('❌ Profiles directory MISSING.');
    }
} else {
    console.log('❌ Uploads directory MISSING.');
}
