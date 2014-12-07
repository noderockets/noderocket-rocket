var THRESHOLD = 5;

module.exports = function (rocket) {
  console.log('Using apogee detection based strategy');

  var lastAltitude = Number.MIN_VALUE;
  var descentCount = 0;

  rocket.on('data', function() {
    var currentAltitude = data.altitude;

    if(lastAltitude > currentAltitude) {
      descentCount++;

      if(descentCount > THRESHOLD) {
        rocket.deployParachute();
      }
    } else {
      descentCount = 0;
    }
  });
};