const fs = require('fs');
const html = fs.readFileSync('src/emails/reset-password.html', 'utf-8');
const urls = html.match(/https:\/\/res\.cloudinary\.com\/[^"']+/g);
console.log(Array.from(new Set(urls)));
