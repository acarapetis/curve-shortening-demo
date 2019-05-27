// Script to start development server, inject hot reloading and start browser
// Usage: npm run browse
var bs = require("browser-sync").create();
var fs = require('fs')

fs.readFile('index.html', 'utf8', function (err, data) {
    var result = data.replace(/bundle.min.mjs/g, 'bundle.mjs');

    fs.writeFile('index.dev.html', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});


bs.init({
    files: [
        '*.html',
        'build/*.js',
        'build/*.mjs',
        '*.css',
    ],
    serveStatic: ['./build'],
    server: {
        baseDir: '.',
        index: 'index.dev.html',
    },
})
