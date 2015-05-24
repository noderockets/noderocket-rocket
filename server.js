/* jshint node:true, strict:false, laxcomma:true */
var Log = require('log');
var express = require('express');
var HTTP = require('http');
var socketIO = require('socket.io');
var fs = require('fs');
var ModuleLoader = require('./module-loader');

if (process.env.ROCKET_MODE === 'mock') {
  var Rocket = require('./mocket');
} else {
  Rocket = require('./pirocket-boreas');
}

var datalog = new Log('debug', fs.createWriteStream('rocket-data.log'));
var eventlog = new Log('debug', fs.createWriteStream('rocket-event.log'));
var serverlog = new Log('debug', fs.createWriteStream('rocket-server.log'));
var consolelog = new Log();

var app = express();
var server = HTTP.createServer(app);
var io = socketIO.listen(server);
var rocket = new Rocket({ log: { data: datalog, event: eventlog } });

io.set('log level', 1);
app.use(express.static(__dirname + '/www'));

// --- LOAD ROCKET MODULES ------------------------------------------------------------
var moduleLoader = new ModuleLoader(rocket, io, app);
moduleLoader.loadFromDir();

// --- SOCKET COMMUNICATION ----------------------------------------------------
rocket.on('rocket.ready', function() {
  consolelog.warning('Rocket Ready!');
});

rocket.on('rocket.data', function(data) {
  io.sockets.emit('rocket-data', data);
});

// Socket IO configuration
io.sockets.on('connection', function (socket) {
  serverlog.info('incoming connection');

  socket.emit('hello', {});

  socket.on('arm-parachute', function(){
    rocket.armParachute();
  });

  socket.on('deploy-parachute', function(){
    rocket.deployParachute();
  });
});


// --- COMMAND CENTER ROUTE ----------------------------------------------------
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/www/index.html');
});

// --- ROCKET MODULE ROUTES ----------------------------------------------------
app.get('/modules/enable', function(req, res) {
  moduleLoader.enable(req.query.module);
  res.send('ok')
});

app.get('/modules/disable', function(req, res) {
  moduleLoader.disable(req.query.module);
  res.send('ok');
});

app.get('/modules', function(req, res) {
  res.json(moduleLoader.getModules());
});

// --- ROCKET SERVER -----------------------------------------------------------
server.listen(process.env.PORT || 80);
consolelog.info('Rocket Command Center on port ' + process.PORT);
consolelog.info('Rocket Data Log written to rocket-data.log');
consolelog.info('Rocket Event Log written to rocket-event.log');
consolelog.info('Rocket Server Log written to rocket-server.log');