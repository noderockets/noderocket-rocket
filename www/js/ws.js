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

socket.on('data', function (data) {
  //console.log('Data', data);
  if(data.alt) addData(data.alt);
});

socket.on('armed', function () {
  console.log('Parachute Armed');
});

socket.on('maxAltitude', function (data) {
  console.log('Max Altitude: ' + data.alt);
});

socket.on('parachute', function (data) {
  console.log('Deploying Parachute at ' + data.alt);
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