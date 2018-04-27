var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Rocket(config) {
  EventEmitter.call(this);
  var rocket = this;

  setTimeout(function () {
    rocket.emit('rocket.ready');
    startFakeData();
  }, 3000);

  function startFakeData() {
    setInterval(function () {
      rocket.emit('rocket.data', {
        ax: Math.random(),
        ay: Math.random(),
        az: Math.random(),
        gx: Math.random(),
        gy: Math.random(),
        gz: Math.random(),
        atmp:Math.random(),
        mtmp: Math.random(),
        bp: Math.random(),
        alt: Math.random()
      })
    }, 50);
  }
}

util.inherits(Rocket, EventEmitter);
module.exports = Rocket;