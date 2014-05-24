/* jshint node:true, strict:false, laxcomma:true */
var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level', 1);

var Altimeter = require('./altimeter');

var altimeter = new Altimeter({});

app.use(express.static(__dirname + '/www'));

server.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/www/index.html');
});

// Socket IO configuration
io.sockets.on('connection', function (socket) {
  socket.emit('hello');

  socket.on('start', function() {
    console.log('Client Started!');

    altimeter.on('init', function(data) {
      socket.emit('reset', {
        alt: data,
        time: new Date()
      });
    });

    altimeter.on('activate', function() {
      socket.emit('activate');
    });

    altimeter.on('data', function(data) {
      socket.emit('data', {
        alt: data,
        time: new Date()
      });
    });

    altimeter.on('armed', function(data) {
      socket.emit('armed', {
        alt: data,
        time: new Date()
      });
    });

    altimeter.on('maxAltitude', function(data) {
      socket.emit('maxAltitude', {
        alt: data,
        time: new Date()
      });
    });

    altimeter.on('parachute', function(data) {
      socket.emit('parachute', {
        alt: data,
        time: new Date()
      });
    });

    altimeter.on('testModeEnabled', function() {
      socket.emit('testModeEnabled');
    });

    altimeter.on('testModeDisabled', function() {
      socket.emit('testModeDisabled');
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
