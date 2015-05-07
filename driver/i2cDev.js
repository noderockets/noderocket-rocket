/**
 * Created by validity on 4/30/15.
 */
/**
 * This class extends the i2c library with some extra functionality available
 * in the i2cdev library that the MPU60X0 library uses.
 */
var i2c = require('i2c');

function I2cDev(address, options) {
  i2c.call(this, address, options);
}

I2cDev.prototype = Object.create(i2c.prototype);
I2cDev.prototype.constructor = I2cDev;

I2cDev.prototype.bitMask = function(bit, bitLength) {
  return ((1 << bitLength) - 1) << (1 + bit - bitLength);
};

I2cDev.prototype.readBits = function(func, bit, bitLength, callback) {
  var mask = this.bitMask(bit, bitLength);
  this.readBytes(func, 1, function(err, buf) {
    var bits = (buf[0] & mask) >> (1 + bit - bitLength);
    callback(err, bits);
  });
};

I2cDev.prototype.writeBits = function(func, bit, bitLength, value, callback) {
  var thiz = this;
  this.readBytes(func, 1, function(err, buffer) {
    var mask = thiz.bitMask(bit, bitLength);
    var newValue = buffer ^ ((buffer ^ (value << bit)) & mask);
    thiz.writeBytes(func, [newValue], callback);
  });
};

I2cDev.prototype.readBit = function(func, bit, callback) {
  this.readBits(func, bit, 1, callback);
};

I2cDev.prototype.writeBit = function(func, bit, value, callback) {
  this.writeBits(func, bit, 1, value, callback);
};

I2cDev.prototype.readByte = function(func, callback) {
  this.readBytes(func, 1, function(err, buffer) {
    callback(err, buffer.readIntLE());
  });
};

I2cDev.prototype.writeByte = function(func, value, callback) {
  var buffer = new Buffer(1);
  buffer.writeIntLE(value);
  this.writeBytes(func, buffer, callback);
};

module.exports = I2cDev;