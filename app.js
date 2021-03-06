var Downloader = require('./src/downloader')
var downloader = new Downloader();

var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
var express = require('express');
var app = express();
var url = require('url');


var port = 8000;

app.get('/cta', function(req, res, next) {
  let ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress
  console.log('Connection from:', ip);
  console.log(req.get('User-Agent'));
  next();
});

// app.use(express.static('./public'));
app.use('/cta', express.static('./client/dist'));
var wss = new WebSocketServer({server:server});

var clients = {};
var currentData;

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});

downloader.on('latest', function(d){
  currentData = {vehicles: d};
  wss.broadcast(currentData);
});




downloader.init();


server.on('request', app);



server.on('error', function(err) {
  console.log(err);
});

server.listen(port, function () {
  console.log('Listening on http://localhost:' + port);
});


wss.on('connection', function connection(ws) {
  // console.log(ws.upgradeReq.headers);
  console.log(Date(), ' - Websocket connected:', ws.upgradeReq.headers['sec-websocket-key']);
  clients[ws.upgradeReq.headers['sec-websocket-key']] = ws;
  console.log(Object.keys(clients).length, 'clients connected');
  if (Object.keys(clients).length > 0) {
    downloader.start();
  }


  ws.on('close', function() {
    console.log(Date(), ' - Websocket Disconnected:', ws.upgradeReq.headers['sec-websocket-key']);
    delete clients[ws.upgradeReq.headers['sec-websocket-key']];
    console.log(Object.keys(clients).length, 'clients connected');
    if (Object.keys(clients).length == 0) {
      downloader.stop();
    }
  });

  ws.on('message', function(message) {
    let msg = JSON.parse(message);
    let user = ws.upgradeReq.headers['sec-websocket-key'];
    console.log('msg from:', user);
    console.log('msg:', msg);

    /* request for pattern */
    if (msg['pid']) {
      if (downloader.patterns[msg['pid']]) {
        ws.send(JSON.stringify({
          ptr: downloader.patterns[msg['pid']]
        }));
      }
    }

  });
});


wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify(data));
  });
};

const piover180 = 0.0174532925;
var avgHeading = function() {
  let x = 0;
  let y = 0;
  currentData.forEach(function(ele){
    x += Math.sin(Number(ele.hdg) * piover180);
    y += Math.cos(Number(ele.hdg) * piover180);
  });
    x /= currentData.length;
    y /= currentData.length;

    return { hdg:   (Math.atan2(x, y) * 180 / Math.PI),
             speed: (Math.sqrt(x**2 + y**2)),
             count: currentData.length
    };
}

var printAvg = function() {
  console.log('Heading:', Math.round(avgHeading().hdg  * 100)/100,
              'Speed:', Math.round(avgHeading().speed * 100)/100,
              'count:', avgHeading().count);
}
