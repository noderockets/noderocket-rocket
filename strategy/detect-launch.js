module.exports = function (rocket) {
  var lauched = false;
  var buffer = [];

  rocket.on('data', function(data) {
    if(!data.launched) {
      buffer.push(data.altitude);

      if(buffer.length > 10) {
        buffer = buffer.slice(-10);
        if(buffer[9] - buffer[0] > 3) {
          rocket.emit('launched');
        }
      }
    }
  });
};