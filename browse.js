// Script to start development server, inject hot reloading and start browser
// Usage: npm run browse
var bs = require("browser-sync").create();
var fs = require('fs')

function buildIndex() {
    fs.readFile('index.html', 'utf8', function (err, data) {
        var result = data.replace(/bundle.min.mjs/g, 'bundle.mjs');

        fs.writeFile('index.dev.html', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

buildIndex();
bs.init({
    files: [
        {
            match: ['index.html'],
            fn: buildIndex,
        },
        'index.dev.html',
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
