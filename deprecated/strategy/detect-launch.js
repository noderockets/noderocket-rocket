var LAUNCH_THRESHOLD = 3;

module.exports = function(rocket) {
  var firstKnown;

  rocket.on('rocket.data', function(data) {
    var current = data.alt;

    if(!firstKnown) {
      firstKnown = current;
    }
    else {
      if (current > (firstKnown + LAUNCH_THRESHOLD)) {
        console.log('detected launch');
        rocket.emit('launched');
      }
    }
  });
};