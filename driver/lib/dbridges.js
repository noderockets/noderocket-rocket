var async = require('async');
var i2c = require('i2c');

module.exports = function BMP085(options) {
  var sensor = function() {};
  var wire = new i2c(options.address);
  var cal = {};

  var BMP085_CONTROL_REGISTER = 0xF4;
  var BMP085_SELECT_TEMP = 0x2E;
  var BMP085_SELECT_PRESSURE = 0x34;
  var BMP085_CONVERSION_RESULT = 0xF6;
  var BMP085_XLSB = 0xF7;

  sensor.scan = function() {
    wire.scan(function(err, data) {
      data.forEach(function(item) {
        console.log(item);
      });
    });
  };

  function toS16(high, low) {
    if (high > 127) high -= 256;
    return (high << 8) + low;
  }

  function toU16(high, low) {
    return (high << 8) + low;
  }

  sensor.calibrate = function() {
    wire.readBytes(0xAA, 22, function(err, data) {
      if (err) {
        console.error('Error calibrating.');
        return;
      }
      cal = {
        ac1: toS16(data[0], data[1]),
        ac2: toS16(data[2], data[3]),
        ac3: toS16(data[4], data[5]),
        ac4: toU16(data[6], data[7]),
        ac5: toU16(data[8], data[9]),
        ac6: toU16(data[10], data[11]),
        b1: toS16(data[12], data[13]),
        b2: toS16(data[14], data[15]),
        mb: toS16(data[16], data[17]),
        mc: toS16(data[18], data[19]),
        md: toS16(data[20], data[21])
      };
    });
  };

  sensor.read = function(call) {
    async.waterfall([

      function(callback) {
        // Write select pressure command to control register
        wire.writeBytes(BMP085_CONTROL_REGISTER, [BMP085_SELECT_PRESSURE + (options.mode << 6)], function() {});
        setTimeout(function() {
          callback(null);
        }, 28);
      },

      function(callback) {
        // Read uncalibrated pressure.
        wire.readBytes(BMP085_CONVERSION_RESULT, 3, function(err, data) {
          callback(null, ((data[0] << 16) + (data[1] << 8) + data[2]) >> (8 - options.mode));
        });
      },

      function(pressure, callback) {
        wire.writeBytes(BMP085_CONTROL_REGISTER, [BMP085_SELECT_TEMP], function() {});
        setTimeout(function() {
          callback(null, pressure);
        }, 8);
      },

      function(pressure, callback) {
        wire.readBytes(BMP085_CONVERSION_RESULT, 2, function(err, data) {
          callback(null, [pressure, toU16(data[0], data[1])]);
        });
      }],

      function(err, res) {
        if (err) call(err, {});
        var uncal_pressure = res[0];
        var uncal_temp = res[1];

        console.log('A2 raw: ' + uncal_pressure);

        // Get calibrated temp
        var x1 = 0;
        var x2 = 0;
        var x3 = 0;
        var b3 = 0;
        var b4 = 0;
        var b5 = 0;
        var b6 = 0;
        var b7 = 0;
        var p = 0;

        x1 = ((uncal_temp - cal.ac6) * cal.ac5) >> 15;
        x2 = (cal.mc << 11) / (x1 + cal.md);
        b5 = x1 + x2;

        var corrected_temp = ((b5 + 8) >> 4) / 10.0;
        if (options.units !== 'metric') corrected_temp = (9 * corrected_temp / 5) + 32;

        // Get calibrated pressure
        x1 = 0;
        x2 = 0;
        x3 = 0;
        b3 = 0;
        b4 = 0;
        b5 = 0;
        b6 = 0;
        b7 = 0;
        p = 0;

        x1 = ((uncal_temp - cal.ac6) * cal.ac5) >> 15;
        x2 = (cal.mc << 11) / (x1 + cal.md);
        b5 = x1 + x2;

        b6 = b5 - 4000;
        x1 = (cal.b2 * (b6 * b6) >> 12) >> 11;
        x2 = (cal.ac2 * b6) >> 11;
        x3 = x1 + x2;
        b3 = (((cal.ac1 * 4 + x3) << options.mode) + 2) / 4;
        x1 = (cal.ac3 * b6) >> 13;
        x2 = (cal.b1 * ((b6 * b6) >> 12)) >> 16;
        x3 = ((x1 + x2) + 2) >> 2;
        b4 = (cal.ac4 * (x3 + 32768)) >> 15;
        b7 = (uncal_pressure - b3) * (50000 >> options.mode);

        if (b7 < 0x80000000) p = (b7 * 2) / b4;
        else p = (b7 / b4) * 2;

        x1 = (p >> 8) * (p >> 8);
        x1 = ((x1 * 3038) >> 16);
        x2 = ((-7357 * p) >> 16);
        p = p + ((x1 + x2 + 3791) >> 4);

        console.log('A2 calc: ' + p);

        if (options.units !== 'metric') p /= 3386.0;

        call(err, {
          pressure: p,
          temperature: corrected_temp
        });
      }
    );
  };

  sensor.calibrate();

  return sensor;
};