var THRESHOLD = 5;

module.exports = function (rocket) {
  console.log('Using apogee detection based strategy');

  var lastAltitude = Number.MIN_VALUE;
  var descentCount = 0;

  // FIXME - this strategy does weird things to the servo
  rocket.on('data', function(data) {

    if(!data.deployed) {
      var currentAltitude = data.altitude;

      if(lastAltitude > currentAltitude) {
        descentCount++;

        if(descentCount > THRESHOLD) {
          rocket.deployParachute();
        }
      } else {
        descentCount = 0;
      }
    }
  });
};