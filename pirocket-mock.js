var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Rocket(config) {
  EventEmitter.call(this);
  var rocket = this;

  setTimeout(function() {
    rocket.emit('rocket.ready');
    startFakeData();
  }, 3000);

  function startFakeData() {
    setInterval(function() {
      rocket.emit('rocket.data', {
        a: 1,
        b: 2
      })
    }, 50);
  }
}

util.inherits(Rocket, EventEmitter);
module.exports = Rocket;