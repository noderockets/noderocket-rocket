var socket = io.connect();
socket.on('ready', function (data) {
  console.log('Launcher Ready!',data);
});

socket.on('hello', function(data) {
  console.log('Hello, Rocket!');
  socket.emit('start', {
    dataInterval: 100
  });
});

socket.on('reset', function() {
  console.log('Reset');
});

socket.on('activate', function() {
  console.log('Ready to launch');
});

socket.on('data', function (data) {
  console.log('Data', data);
//  if(data.alt) addData(data.alt);
  if(data) addData(data);
});

socket.on('armed', function () {
  console.log('Parachute Armed');
});

socket.on('maxAltitude', function (data) {
  console.log('Max Altitude: ' + data);
});

socket.on('parachute', function (data) {
  console.log('Deploying Parachute at ' + data);
});

socket.on('testModeEnabled', function () {
  console.log('Test mode enabled');
});

socket.on('testModeDisabled', function () {
  console.log('Test mode disabled');
});


function deployParachute () {
	socket.emit('parachute');
}

function reset() {
	socket.emit('reset');
}

function activate() {
    socket.emit('activate');
}

function servoAngles(init, release) {
	socket.emit('servoAngles', {init:init, release:release});
}