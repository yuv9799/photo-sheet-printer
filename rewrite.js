const fs = require('fs')
fs.writeFileSync('app/lib/processImage.ts', fs.readFileSync('app/lib/processImage.ts', 'utf8').replace('Return statement is not allowed here', 'fixed'))
console.log('done')