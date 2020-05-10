var express = require('express');
var app = express();
app.use('/', (req, res, next) => {
    if(req.url.match(/(.git|server.js)/)) {
        return res.status(404).end("Cannot GET " + req.url);
    }
    next();
});
app.use('/', express.static(__dirname));
app.listen(8080);
