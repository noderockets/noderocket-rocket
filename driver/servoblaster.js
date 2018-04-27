/**
 * Created by validity on 5/20/15.
 */
var fs = require("fs");
var FIFO_FILE_PATH = "/dev/servoblaster";

function writeCommand(cmd, callback) {
  var buffer = new Buffer(cmd + "\n");
  var fd = fs.open(FIFO_FILE_PATH, "w", undefined, function(err, fd) {
    if (err) {
      if (callback && typeof callback == 'function') callback(err);
    }
    else {
      fs.write(fd, buffer, 0, buffer.length, -1, function(error, written, buffer) {
        if (error) {
          if (callback && typeof callback == 'function') callback(error);
        }
        else {
          fs.close(fd);
          if (callback && typeof callback == 'function') callback();
        }
      });
    }
  });
}

module.exports = {
  setPwm: function(pinNumber, value, callback) {
    writeCommand(pinNumber + "=" + value, callback);
  }
};
