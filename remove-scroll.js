const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let count = 0;
walkDir('src/app', function(filePath) {
    if (filePath.endsWith('page.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/import \{ ScrollToTop \} from "@\/components\/utils\/ScrollToTop";\r?\n?/g, '')
            .replace(/^[ \t]*<ScrollToTop \/>\r?\n?/gm, '');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated ' + filePath);
            count++;
        }
    }
});
console.log(`Successfully removed ScrollToTop from ${count} files.`);
