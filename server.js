/* jshint node:true, strict:false, laxcomma:true */
var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level', 1);

//app.use(express.static(__dirname + '/www'));

var Rocket = require('./pirocket');
var rocket = new Rocket();

require('./strategy/detect-launch')(rocket);
require('./strategy/parachute-timer')(rocket);

rocket.on('data', function(data) {
  io.sockets.emit('rocket-data', data)
});


// Socket IO configuration
io.sockets.on('connection', function (socket) {
  console.log('incoming connection');

  socket.emit('hello', {});

  socket.on('arm-parachute', function(){
    rocket.armParachute();
  });

  socket.on('deploy-parachute', function(){
    rocket.deployParachute();
  });
});


// Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/www/index.html');
});


// Listen
server.listen(80);
console.log('Rocket listening on port 80');