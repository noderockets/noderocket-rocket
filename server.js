var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level', 1);

var Altimeter = require('./altimeter');

var altimeter;

app.use(express.static(__dirname + '/www'));

server.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/www/index.html');
});

// Socket IO configuration
io.sockets.on('connection', function (socket) {
  socket.emit('hello');

  socket.on('start', function(data) {
    console.log(data);

    // Initialize altimeter if not already
    if(!altimeter) {
      altimeter = new Altimeter(data);
    }

    // Emit altimeter data
    altimeter.on('data', function(data) {
      socket.emit('data', data);
    });

    altimeter.on('armed', function() {
      socket.emit('armed');
    });

    altimeter.on('maxAltitude', function(data) {
      socket.emit('maxAltitude', data);
    });

    altimeter.on('parachute', function(data) {
      socket.emit('parachute', data);
    });
  });

  socket.on('servoAngles', function(data) {
    altimeter.setServoInitAngle(data.init);
    altimeter.setServoReleaseAngle(data.release);
  });

  socket.on('reset', function() {
    altimeter.emit('init');
  });

  socket.on('activate', function() {
    altimeter.emit('activate');
  });

  socket.on('parachute', function() {
    altimeter.emit('parachute');
  });
});
