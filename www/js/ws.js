/* jshint strict:false */
/* global io, rocketInfo */

var socket = io.connect();

var chartEl = document.querySelector('#chart');
var logEl = document.querySelector('#msgs');

var info = rocketInfo(chartEl, logEl);

// info.chart.addData(altitude, time);
// info.chart.addMessage(altitude, time, message);
// info.chart.reset();
// info.chart.baseAlt(altitude);

// info.log.append(message, time);
// info.log.clear();

var vid_url = 'http://' + window.location.hostname + ':8080/?action=stream';
document.querySelector('#preview img').src = vid_url;

document.querySelector('#log a').addEventListener('click', info.log.clear);
document.querySelector('#chart .reset').addEventListener('click', info.chart.reset);
document.querySelector('#chart .pause').addEventListener('click', pauseResume);

document.querySelector('#reset').addEventListener('click', reset);
document.querySelector('#activate').addEventListener('click', activate);
document.querySelector('#parachute').addEventListener('click', deployParachute);

var pauseFlag = false;
function pauseResume() {
  pauseFlag = !pauseFlag;
  document.querySelector('#chart .pause').innerText = pauseFlag ? 'Resume' : 'Pause';
}

socket.on('ready', function () {
  info.log.append('Launcher Ready!', new Date());
});

socket.on('hello', function() {
  info.log.append('Hello, Rocket!', new Date());
  socket.emit('start', {});
});

socket.on('reset', function(data) {
  info.log.append('Reset: ' + data.alt, data.time);
  if (!pauseFlag && data.alt !== undefined) info.chart.baseAlt(data.alt);
});

socket.on('activate', function() {
  info.log.append('Ready to launch', new Date());
});

socket.on('data', function (data) {
  if (!pauseFlag && data) {
    info.chart.addData(data.alt, data.time);
  }
});

socket.on('armed', function (data) {
  info.log.append('Parachute Armed', data.time);
  if (!pauseFlag) info.chart.addMessage(data.alt, data.time, 'Armed');
});

socket.on('maxAltitude', function (data) {
  info.log.append('Max Altitude: ' + data.alt, data.time);
  if (!pauseFlag) info.chart.addMessage(data.alt, data.time, 'Apogee');
});

socket.on('parachute', function (data) {
  info.log.append('Deploying Parachute at: ' + data.alt, data.time);
  if (!pauseFlag) info.chart.addMessage(data.alt, data.time, 'Parachute');
});

socket.on('testModeEnabled', function () {
  info.log.append('Test mode enabled', new Date());
});

socket.on('testModeDisabled', function () {
  info.log.append('Test mode disabled', new Date());
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
