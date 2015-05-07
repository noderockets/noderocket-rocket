/**
 * BMP085/BMP180 device I2C library for Node.js 2015/03/18 by NodeRockets
 *
 * Changelog:
 *    XX - ToDo...
 */
 //============================================================================================
 // BMP180 device I2C library code for Node.js is placed under the MIT license
 // Copyright (c) 2015 Thomas A. Valletta
 //
 // Permission is hereby granted, free of charge, to any person obtaining a copy
 // of this software and associated documentation files (the "Software"), to deal
 // in the Software without restriction, including without limitation the rights
 // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 // copies of the Software, and to permit persons to whom the Software is
 // furnished to do so, subject to the following conditions:
 //
 // The above copyright notice and this permission notice shall be included in
 // all copies or substantial portions of the Software.
 //
 // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 // THE SOFTWARE.
 //================================================================================================

var Bmp085 = require('./lib/bmp085');

function Bmp180(opts) {
  Bmp085.call(this, opts);
}

Bmp180.prototype = Object.create(Bmp085.prototype);
Bmp180.prototype.constructor = Bmp180;

Bmp180.prototype.sealevelPressure = 101325;

Bmp180.prototype.calcAltitude = function(pressure) {
  return 44330 * (1.0 - Math.pow(pressure / this.sealevelPressure, 0.1903));
};

Bmp180.prototype.readAltitude = function(callback) {
  var self = this;
  this.readPressure(function(pressure) {
    callback(self.calcAltitude(pressure));
  });
};

Bmp180.prototype.readData = function(callback) {
  var self = this;

  var rawTemperature;
  var rawPressure;
  function rawDataCb() {
    if (!rawTemperature || !rawPressure) return;
    callback({
      tmp: self.convertTemperature(rawTemperature),
      bp: self.convertPressure(rawPressure),
      alt: self.calcAltitude(rawPressure)
    })
  }

  this.readTemperature(function(data) {
    rawTemperature = data;
    rawDataCb();
  });
  this.readPressure(function(data) {
    rawPressure = data;
    rawDataCb();
  });
};

module.exports = Bmp180;