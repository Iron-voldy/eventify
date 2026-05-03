const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/Lenovo/Desktop/mobile_apps/frontend/src';

const replaceInFiles = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      replaceInFiles(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('₹')) {
        content = content.replace(/₹/g, 'LKR ');
        content = content.replace(/\(LKR \)/g, '(LKR)'); // Fix (₹) -> (LKR)
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
};

replaceInFiles(directory);
console.log('Currency replaced successfully!');
