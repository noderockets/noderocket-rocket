var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level', 1);

var Gyro = require('./gyro');

var gyro;

app.use(express.static('www'));

server.listen(8082);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// Socket IO configuration
io.sockets.on('connection', function (socket) {
  socket.emit('hello');

  socket.on('start', function(data) {
    console.log(data);

    // Initialize altimeter if not already
    if(!gyro) {
      gyro = new Gyro(data);
    }

    // Emit altimeter data
    gyro.on('data', function(data) {
      socket.emit('data', data);
    });
  });
});


