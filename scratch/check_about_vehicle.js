const fs = require('fs');

const app = fs.readFileSync('js/app.js', 'utf8');
const pos = app.indexOf('About This Vehicle');
console.log(app.slice(pos - 100, pos + 200));
