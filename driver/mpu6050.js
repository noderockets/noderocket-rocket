/**
 * MPU6050 complete device I2C library for Node.js
 * Based on Jeff Rowberg's MPU6050 I2C device library.
 *
 * Parts of this library were taken from the minimal MPU6050 library
 * by Jason Stapels <jstapels@gmail.com>
 *
 * Changelog:
 *     XX - ToDo...
 */
//============================================================================================
// MPU6050 device I2C library code for Node.js is placed under the MIT license
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

var I2cDev = require('./i2cDev');
var _ = require('underscore');

/**
 * Default constructor, uses default I2C address or default SS Pin if SPI
 * @see MPU6050.DEFAULT_ADDRESS
 */
function MPU6050(options) {
  var defaults = {
    device: '/dev/i2c-1',
    address: MPU6050.DEFAULT_ADDRESS,
    accelerometer: { mode: 3 },
    gyroscope: { mode: 0 },
    warmups: 10,
    debug: true
  };

  _.extend(this, defaults, options);

  var accelerometerModes = [
    [MPU6050.ACCEL_FS_2, 16384],
    [MPU6050.ACCEL_FS_4, 8192],
    [MPU6050.ACCEL_FS_8, 4096],
    [MPU6050.ACCEL_FS_16, 4096]
  ];

  var gyroscopeModes = [
    [MPU6050.GYRO_FS_250, 131],
    [MPU6050.GYRO_FS_500, 65.5],
    [MPU6050.GYRO_FS_1000, 32.8],
    [MPU6050.GYRO_FS_2000, 16.4]
  ];

  this.accelerometer.range = accelerometerModes[this.accelerometer.mode][0];
  this.accelerometer.denominator = accelerometerModes[this.accelerometer.mode][1];
  this.gyroscope.range = gyroscopeModes[this.gyroscope.mode][0];
  this.gyroscope.denominator = gyroscopeModes[this.gyroscope.mode][1];
}

MPU6050.ADDRESS_AD0_LOW = 0x68; // address pin low (GND); default for InvenSense evaluation board
MPU6050.ADDRESS_AD0_HIGH = 0x69; // address pin high (VCC)
MPU6050.DEFAULT_ADDRESS = MPU6050.ADDRESS_AD0_LOW;

MPU6050.RA_ACCEL_XOUT_H = 0x3B;
MPU6050.RA_ACCEL_XOUT_L = 0x3C;
MPU6050.RA_ACCEL_YOUT_H = 0x3D;
MPU6050.RA_ACCEL_YOUT_L = 0x3E;
MPU6050.RA_ACCEL_ZOUT_H = 0x3F;
MPU6050.RA_ACCEL_ZOUT_L = 0x40;

/**
 * full-scale gyroscope range.
 * The FS_SEL parameter allows setting the full-scale range of the gyro sensors,
 * as described in the table below.
 *
 * 0 = +/- 250 degrees/sec
 * 1 = +/- 500 degrees/sec
 * 2 = +/- 1000 degrees/sec
 * 3 = +/- 2000 degrees/sec
 */
MPU6050.RA_GYRO_CONFIG = 0x1B;

MPU6050.GCONFIG_FS_SEL_BIT = 4;
MPU6050.GCONFIG_FS_SEL_LENGTH = 2;

MPU6050.GYRO_FS_250 = 0x00;
MPU6050.GYRO_FS_500 = 0x01;
MPU6050.GYRO_FS_1000 = 0x02;
MPU6050.GYRO_FS_2000 = 0x03;

MPU6050.prototype.getFullScaleGyroRange = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_GYRO_CONFIG, MPU6050.GCONFIG_FS_SEL_BIT, MPU6050.GCONFIG_FS_SEL_LENGTH, callback);
};
MPU6050.prototype.setFullScaleGyroRange = function(range, callback) {
  this.i2cdev.writeBits(MPU6050.RA_GYRO_CONFIG, MPU6050.GCONFIG_FS_SEL_BIT, MPU6050.GCONFIG_FS_SEL_LENGTH, range, callback);
};

/**
 * AUX_VDDIO register (InvenSense demo code calls this RA_*G_OFFS_TC)
 * When set to 1, the auxiliary I2C bus high logic level is VDD. When cleared to
 * 0, the auxiliary I2C bus high logic level is VLOGIC. This does not apply to
 * the MPU-6000, which does not have a VLOGIC pin.
 * (0=VLOGIC, 1=VDD)
 */
MPU6050.RA_XG_OFFS_TC = 0x00;
MPU6050.RA_YG_OFFS_TC = 0x01;
MPU6050.RA_ZG_OFFS_TC = 0x02;

MPU6050.TC_PWR_MODE_BIT = 7;
MPU6050.TC_PWR_MODE_LENGTH = 1;
MPU6050.TC_OFFSET_BIT = 6;
MPU6050.TC_OFFSET_LENGTH = 6;
MPU6050.TC_OTP_BNK_VLD_BIT = 0;

MPU6050.VDDIO_LEVEL_VLOGIC = 0;
MPU6050.VDDIO_LEVEL_VDD = 1;

MPU6050.prototype.getAuxVDDIOLevel = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_YG_OFFS_TC, MPU6050.TC_PWR_MODE_BIT, MPU6050.TC_PWR_MODE_LENGTH, callback);
};
MPU6050.prototype.setAuxVDDIOLevel = function(level, callback) {
  this.i2cdev.writeBits(MPU6050.RA_YG_OFFS_TC, MPU6050.TC_PWR_MODE_BIT, MPU6050.TC_PWR_MODE_LENGTH, level, callback);
};

/** Gyroscope output rate divider.
 * The sensor register output, FIFO output, DMP sampling, Motion detection, Zero
 * Motion detection, and Free Fall detection are all based on the Sample Rate.
 * The Sample Rate is generated by dividing the gyroscope output rate by
 * SMPLRT_DIV:
 *
 * Sample Rate = Gyroscope Output Rate / (1 + SMPLRT_DIV)
 *
 * where Gyroscope Output Rate = 8kHz when the DLPF is disabled (DLPF_CFG = 0 or
 * 7), and 1kHz when the DLPF is enabled (see Register 26).
 *
 * Note: The accelerometer output rate is 1kHz. This means that for a Sample
 * Rate greater than 1kHz, the same accelerometer sample may be output to the
 * FIFO, DMP, and sensor registers more than once.
 *
 * For a diagram of the gyroscope and accelerometer signal paths, see Section 8
 * of the MPU-6000/MPU-6050 Product Specification document.
 */
MPU6050.RA_SMPLRT_DIV = 0x19;

MPU6050.prototype.getGyroRateDivider = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_SMPLRT_DIV, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setGyroRateDivider = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_SMPLRT_DIV, value, callback);
};

/**
 * External FSYNC configuration.
 * Configures the external Frame Synchronization (FSYNC) pin sampling. An
 * external signal connected to the FSYNC pin can be sampled by configuring
 * EXT_SYNC_SET. Signal changes to the FSYNC pin are latched so that short
 * strobes may be captured. The latched FSYNC signal will be sampled at the
 * Sampling Rate, as defined in register 25. After sampling, the latch will
 * reset to the current FSYNC signal state.
 *
 * The sampled value will be reported in place of the least significant bit in
 * a sensor data register determined by the value of EXT_SYNC_SET according to
 * the following table.
 *
 * EXT_SYNC_SET | FSYNC Bit Location
 * -------------+-------------------
 * 0            | Input disabled
 * 1            | TEMP_OUT_L[0]
 * 2            | GYRO_XOUT_L[0]
 * 3            | GYRO_YOUT_L[0]
 * 4            | GYRO_ZOUT_L[0]
 * 5            | ACCEL_XOUT_L[0]
 * 6            | ACCEL_YOUT_L[0]
 * 7            | ACCEL_ZOUT_L[0]
 *
 *
 * === Digital low-pass filter configuration ===================================
 *
 * The DLPF_CFG parameter sets the digital low pass filter configuration. It
 * also determines the internal sampling rate used by the device as shown in
 * the table below.
 *
 * Note: The accelerometer output rate is 1kHz. This means that for a Sample
 * Rate greater than 1kHz, the same accelerometer sample may be output to the
 * FIFO, DMP, and sensor registers more than once.
 *
 *          |   ACCELEROMETER    |           GYROSCOPE
 * DLPF_CFG | Bandwidth | Delay  | Bandwidth | Delay  | Sample Rate
 * ---------+-----------+--------+-----------+--------+-------------
 * 0        | 260Hz     | 0ms    | 256Hz     | 0.98ms | 8kHz
 * 1        | 184Hz     | 2.0ms  | 188Hz     | 1.9ms  | 1kHz
 * 2        | 94Hz      | 3.0ms  | 98Hz      | 2.8ms  | 1kHz
 * 3        | 44Hz      | 4.9ms  | 42Hz      | 4.8ms  | 1kHz
 * 4        | 21Hz      | 8.5ms  | 20Hz      | 8.3ms  | 1kHz
 * 5        | 10Hz      | 13.8ms | 10Hz      | 13.4ms | 1kHz
 * 6        | 5Hz       | 19.0ms | 5Hz       | 18.6ms | 1kHz
 * 7        |   -- Reserved --   |   -- Reserved --   | Reserved
 */
MPU6050.RA_CONFIG = 0x1A;
MPU6050.CFG_EXT_SYNC_SET_BIT = 5;
MPU6050.CFG_EXT_SYNC_SET_LENGTH = 3;
MPU6050.CFG_DLPF_CFG_BIT = 2;
MPU6050.CFG_DLPF_CFG_LENGTH = 3;

MPU6050.prototype.getExternalFrameSync = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_CONFIG, MPU6050.CFG_DLPF_CFG_BIT, MPU6050.CFG_EXT_SYNC_SET_LENGTH, callback);
};
MPU6050.prototype.setExternalFrameSync = function(sync, callback) {
  this.i2cdev.writeBits(MPU6050.RA_CONFIG, MPU6050.CFG_DLPF_CFG_BIT, MPU6050.CFG_EXT_SYNC_SET_LENGTH, sync, callback);
};

MPU6050.prototype.getDigitalLowPassFilterMode = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_CONFIG, MPU6050.CFG_DLPF_CFG_BIT, MPU6050.CFG_DLPF_CFG_LENGTH, callback);
};
MPU6050.prototype.setDigitalLowPassFilterMode = function(mode, callback) {
  this.i2cdev.writeBits(MPU6050.RA_CONFIG, MPU6050.CFG_DLPF_CFG_BIT, MPU6050.CFG_DLPF_CFG_LENGTH, mode, callback);
};

/**
 * High-pass filter configuration.
 * The DHPF is a filter module in the path leading to motion detectors (Free
 * Fall, Motion threshold, and Zero Motion). The high pass filter output is not
 * available to the data registers (see Figure in Section 8 of the MPU-6000/
 * MPU-6050 Product Specification document).
 *
 * The high pass filter has three modes:
 *
 * <pre>
 *    Reset: The filter output settles to zero within one sample. This
 *           effectively disables the high pass filter. This mode may be toggled
 *           to quickly settle the filter.
 *
 *    On:    The high pass filter will pass signals above the cut off frequency.
 *
 *    Hold:  When triggered, the filter holds the present sample. The filter
 *           output will be the difference between the input sample and the held
 *           sample.
 * </pre>
 *
 * <pre>
 * ACCEL_HPF | Filter Mode | Cut-off Frequency
 * ----------+-------------+------------------
 * 0         | Reset       | None
 * 1         | On          | 5Hz
 * 2         | On          | 2.5Hz
 * 3         | On          | 1.25Hz
 * 4         | On          | 0.63Hz
 * 7         | Hold        | None
 *
 *
 * 0 = +/- 2g
 * 1 = +/- 4g
 * 2 = +/- 8g
 * 3 = +/- 16g
 */
MPU6050.RA_ACCEL_CONFIG = 0x1C;
MPU6050.ACONFIG_XA_ST_BIT = 7;         // ACCELEROMETER X SELF TEST ENABLED
MPU6050.ACONFIG_YA_ST_BIT = 6;         // ACCELEROMETER Y SELF TEST ENABLED
MPU6050.ACONFIG_ZA_ST_BIT = 5;         // ACCELEROMETER Z SELF TEST ENABLED
MPU6050.ACONFIG_AFS_SEL_BIT = 4;
MPU6050.ACONFIG_AFS_SEL_LENGTH = 2;
MPU6050.ACONFIG_ACCEL_HPF_BIT = 2;
MPU6050.ACONFIG_ACCEL_HPF_LENGTH = 3;

MPU6050.ACCEL_FS_2 = 0x00;
MPU6050.ACCEL_FS_4 = 0x01;
MPU6050.ACCEL_FS_8 = 0x02;
MPU6050.ACCEL_FS_16 = 0x03;

MPU6050.prototype.getAccelXSelfTest = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_XA_ST_BIT, callback);
};
MPU6050.prototype.setAccelXSelfTest = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_XA_ST_BIT, enable, callback);
};

MPU6050.prototype.getAccelYSelfTest = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_YA_ST_BIT, callback);
};
MPU6050.prototype.setAccelYSelfTest = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_YA_ST_BIT, enable, callback);
};

MPU6050.prototype.getAccelZSelfTest = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_ZA_ST_BIT, callback);
};
MPU6050.prototype.setAccelZSelfTest = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_ZA_ST_BIT, enable, callback);
};

MPU6050.prototype.getFullScaleAccelRange = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_AFS_SEL_BIT, MPU6050.ACONFIG_AFS_SEL_LENGTH, callback);
};
MPU6050.prototype.setFullScaleAccelRange = function(range, callback) {
  this.i2cdev.writeBits(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_AFS_SEL_BIT, MPU6050.ACONFIG_AFS_SEL_LENGTH, range, callback);
};

MPU6050.prototype.getDigitalHighPassFilterMode = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_ACCEL_HPF_BIT, MPU6050.ACONFIG_ACCEL_HPF_LENGTH, callback);
};
MPU6050.prototype.setDigitalHighPassFilterMode = function(mode, callback) {
  this.i2cdev.writeBits(MPU6050.RA_ACCEL_CONFIG, MPU6050.ACONFIG_ACCEL_HPF_BIT, MPU6050.ACONFIG_ACCEL_HPF_LENGTH, mode, callback);
};

/** Free-fall event acceleration threshold.
 * This register configures the detection threshold for Free Fall event
 * detection. The unit of FF_THR is 1LSB = 2mg. Free Fall is detected when the
 * absolute value of the accelerometer measurements for the three axes are each
 * less than the detection threshold. This condition increments the Free Fall
 * duration counter (Register 30). The Free Fall interrupt is triggered when the
 * Free Fall duration counter reaches the time specified in FF_DUR.
 *
 * For more details on the Free Fall detection interrupt, see Section 8.2 of the
 * MPU-6000/MPU-6050 Product Specification document as well as Registers 56 and
 * 58 of this document.
 */
MPU6050.RA_FF_THR = 0x1D;

MPU6050.prototype.getFreeFallDetectionThreshold = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_FF_THR, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setFreeFallDetectionThreshold = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_FF_THR, value, callback);
};

/** Free-fall event duration threshold.
 * This register configures the duration counter threshold for Free Fall event
 * detection. The duration counter ticks at 1kHz, therefore FF_DUR has a unit
 * of 1 LSB = 1 ms.
 *
 * The Free Fall duration counter increments while the absolute value of the
 * accelerometer measurements are each less than the detection threshold
 * (Register 29). The Free Fall interrupt is triggered when the Free Fall
 * duration counter reaches the time specified in this register.
 *
 * For more details on the Free Fall detection interrupt, see Section 8.2 of
 * the MPU-6000/MPU-6050 Product Specification document as well as Registers 56
 * and 58 of this document.
 */
MPU6050.RA_FF_DUR = 0x1E;

MPU6050.prototype.getFreeFallDurationThreshold = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_FF_DUR, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setFreeFallDurationThreshold = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_FF_DUR, value, callback);
};

/** Motion detection event acceleration threshold.
 * This register configures the detection threshold for Motion interrupt
 * generation. The unit of MOT_THR is 1LSB = 2mg. Motion is detected when the
 * absolute value of any of the accelerometer measurements exceeds this Motion
 * detection threshold. This condition increments the Motion detection duration
 * counter (Register 32). The Motion detection interrupt is triggered when the
 * Motion Detection counter reaches the time count specified in MOT_DUR
 * (Register 32).
 *
 * The Motion interrupt will indicate the axis and polarity of detected motion
 * in MOT_DETECT_STATUS (Register 97).
 *
 * For more details on the Motion detection interrupt, see Section 8.3 of the
 * MPU-6000/MPU-6050 Product Specification document as well as Registers 56 and
 * 58 of this document.
 */
MPU6050.RA_MOT_THR = 0x1F;

MPU6050.prototype.getMotionDetectionThreshold = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_MOT_THR, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setMotionDetectionThreshold = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_MOT_THR, value, callback);
};

/** Motion detection event duration threshold.
 * This register configures the duration counter threshold for Motion interrupt
 * generation. The duration counter ticks at 1 kHz, therefore MOT_DUR has a unit
 * of 1LSB = 1ms. The Motion detection duration counter increments when the
 * absolute value of any of the accelerometer measurements exceeds the Motion
 * detection threshold (Register 31). The Motion detection interrupt is
 * triggered when the Motion detection counter reaches the time count specified
 * in this register.
 *
 * For more details on the Motion detection interrupt, see Section 8.3 of the
 * MPU-6000/MPU-6050 Product Specification document.
 */
MPU6050.RA_MOT_DUR = 0x20;

MPU6050.prototype.getMotionDurationThreshold = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_MOT_DUR, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setMotionDurationThreshold = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_MOT_DUR, value, callback);
};

/** Zero motion detection event acceleration threshold.
 * This register configures the detection threshold for Zero Motion interrupt
 * generation. The unit of ZRMOT_THR is 1LSB = 2mg. Zero Motion is detected when
 * the absolute value of the accelerometer measurements for the 3 axes are each
 * less than the detection threshold. This condition increments the Zero Motion
 * duration counter (Register 34). The Zero Motion interrupt is triggered when
 * the Zero Motion duration counter reaches the time count specified in
 * ZRMOT_DUR (Register 34).
 *
 * Unlike Free Fall or Motion detection, Zero Motion detection triggers an
 * interrupt both when Zero Motion is first detected and when Zero Motion is no
 * longer detected.
 *
 * When a zero motion event is detected, a Zero Motion Status will be indicated
 * in the MOT_DETECT_STATUS register (Register 97). When a motion-to-zero-motion
 * condition is detected, the status bit is set to 1. When a zero-motion-to-
 * motion condition is detected, the status bit is set to 0.
 *
 * For more details on the Zero Motion detection interrupt, see Section 8.4 of
 * the MPU-6000/MPU-6050 Product Specification document as well as Registers 56
 * and 58 of this document.
 */
MPU6050.RA_ZRMOT_THR = 0x21;

MPU6050.prototype.getZeroMotionThreshold = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ZRMOT_THR, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setZeroMotionThreshold = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_ZRMOT_THR, value, callback);
};

/** Zero motion detection event duration threshold.
 * This register configures the duration counter threshold for Zero Motion
 * interrupt generation. The duration counter ticks at 16 Hz, therefore
 * ZRMOT_DUR has a unit of 1 LSB = 64 ms. The Zero Motion duration counter
 * increments while the absolute value of the accelerometer measurements are
 * each less than the detection threshold (Register 33). The Zero Motion
 * interrupt is triggered when the Zero Motion duration counter reaches the time
 * count specified in this register.
 *
 * For more details on the Zero Motion detection interrupt, see Section 8.4 of
 * the MPU-6000/MPU-6050 Product Specification document, as well as Registers 56
 * and 58 of this document.
 */
MPU6050.RA_ZRMOT_DUR = 0x22;

MPU6050.prototype.getZeroMotionDurationThreshold = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ZRMOT_DUR, 1, function(err, buffer) {
    //probeBufferType(buffer);
    callback(err, buffer.readIntLE(0));
  });
};
MPU6050.prototype.setMotionDurationDurationThreshold = function(value, callback) {
  this.i2cdev.writeBytes(MPU6050.RA_ZRMOT_DUR, value, callback);
};

/**
 * Temperature FIFO enabled value.
 * When set to 1, this bit enables TEMP_OUT_H and TEMP_OUT_L (Registers 65 and
 * 66) to be written into the FIFO buffer.
 *
 *  Get gyroscope X-axis FIFO enabled value.
 * When set to 1, this bit enables GYRO_XOUT_H and GYRO_XOUT_L (Registers 67 and
 * 68) to be written into the FIFO buffer.
 *
 *  Get gyroscope Y-axis FIFO enabled value.
 * When set to 1, this bit enables GYRO_YOUT_H and GYRO_YOUT_L (Registers 69 and
 * 70) to be written into the FIFO buffer.
 *
 * Get gyroscope Z-axis FIFO enabled value.
 * When set to 1, this bit enables GYRO_ZOUT_H and GYRO_ZOUT_L (Registers 71 and
 * 72) to be written into the FIFO buffer.
 *
 * Get accelerometer FIFO enabled value.
 * When set to 1, this bit enables ACCEL_XOUT_H, ACCEL_XOUT_L, ACCEL_YOUT_H,
 * ACCEL_YOUT_L, ACCEL_ZOUT_H, and ACCEL_ZOUT_L (Registers 59 to 64) to be
 * written into the FIFO buffer.
 *
 *  Get Slave 2 FIFO enabled value.
 * When set to 1, this bit enables EXT_SENS_DATA registers (Registers 73 to 96)
 * associated with Slave 2 to be written into the FIFO buffer.
 *
 *  Get Slave 1 FIFO enabled value.
 * When set to 1, this bit enables EXT_SENS_DATA registers (Registers 73 to 96)
 * associated with Slave 1 to be written into the FIFO buffer.
 *
 * Get Slave 0 FIFO enabled value.
 * When set to 1, this bit enables EXT_SENS_DATA registers (Registers 73 to 96)
 * associated with Slave 0 to be written into the FIFO buffer.
 */
MPU6050.RA_FIFO_EN = 0x23;

MPU6050.TEMP_FIFO_EN_BIT = 7;
MPU6050.XG_FIFO_EN_BIT = 6;
MPU6050.YG_FIFO_EN_BIT = 5;
MPU6050.ZG_FIFO_EN_BIT = 4;
MPU6050.ACCEL_FIFO_EN_BIT = 3;
MPU6050.SLV2_FIFO_EN_BIT = 2;
MPU6050.SLV1_FIFO_EN_BIT = 1;
MPU6050.SLV0_FIFO_EN_BIT = 0;

MPU6050.prototype.getTempFIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.TEMP_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setTempFIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.TEMP_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getXGyroFIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.XG_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setXGyroFIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.XG_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getYGyroFIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.YG_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setYGyroFIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.YG_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getZGyroFIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.ZG_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setZGyroFIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.ZG_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getAccelFIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.ACCEL_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setAccelFIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.ACCEL_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getSlave2FIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.SLV2_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setSlave2FIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.SLV2_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getSlave1FIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.SLV1_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setSlave1FIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.SLV1_FIFO_EN_BIT, enable, callback);
};

MPU6050.prototype.getSlave0FIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_FIFO_EN, MPU6050.SLV0_FIFO_EN_BIT, callback);
};
MPU6050.prototype.setSlave0FIFOEnabled = function(enable, callback) {
  this.i2cdev.writeBit(MPU6050.RA_FIFO_EN, MPU6050.SLV0_FIFO_EN_BIT, enable, callback);
};

// I2C_MST_CTRL register

/**
 * Multi-master enabled value.
 * Multi-master capability allows multiple I2C masters to operate on the same
 * bus. In circuits where multi-master capability is required, set MULT_MST_EN
 * to 1. This will increase current drawn by approximately 30uA.
 *
 * In circuits where multi-master capability is required, the state of the I2C
 * bus must always be monitored by each separate I2C Master. Before an I2C
 * Master can assume arbitration of the bus, it must first confirm that no other
 * I2C Master has arbitration of the bus. When MULT_MST_EN is set to 1, the
 * MPU-60X0's bus arbitration detection logic is turned on, enabling it to
 * detect when the bus is available.
 *
 * @return Current multi-master enabled value
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.RA_I2C_MST_CTRL = 0x24;

MPU6050.MULT_MST_EN_BIT = 7;
MPU6050.WAIT_FOR_ES_BIT = 6;
MPU6050.SLV_3_FIFO_EN_BIT = 5;
MPU6050.I2C_MST_P_NSR_BIT = 4;
MPU6050.I2C_MST_CLK_BIT = 3;
MPU6050.I2C_MST_CLK_LENGTH = 4;

MPU6050.prototype.getMultiMasterEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.MULT_MST_EN_BIT, callback);
};
/** Set multi-master enabled value.
 * @param enabled New multi-master enabled value
 * @see getMultiMasterEnabled()
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.setMultiMasterEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.MULT_MST_EN_BIT, enabled, callback);
};
/** Get wait-for-external-sensor-data enabled value.
 * When the WAIT_FOR_ES bit is set to 1, the Data Ready interrupt will be
 * delayed until External Sensor data from the Slave Devices are loaded into the
 * EXT_SENS_DATA registers. This is used to ensure that both the internal sensor
 * data (i.e. from gyro and accel) and external sensor data have been loaded to
 * their respective data registers (i.e. the data is synced) when the Data Ready
 * interrupt is triggered.
 *
 * @return Current wait-for-external-sensor-data enabled value
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.getWaitForExternalSensorEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.WAIT_FOR_ES_BIT, callback);
};
/** Set wait-for-external-sensor-data enabled value.
 * @param enabled New wait-for-external-sensor-data enabled value
 * @see getWaitForExternalSensorEnabled()
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.setWaitForExternalSensorEnabled = function(enabled) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.WAIT_FOR_ES_BIT, enabled);
};
/** Get Slave 3 FIFO enabled value.
 * When set to 1, this bit enables EXT_SENS_DATA registers (Registers 73 to 96)
 * associated with Slave 3 to be written into the FIFO buffer.
 * @return Current Slave 3 FIFO enabled value
 * @see MPU6050.RA_MST_CTRL
 */
MPU6050.prototype.getSlave3FIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.SLV_3_FIFO_EN_BIT, callback);
};
/** Set Slave 3 FIFO enabled value.
 * @param enabled New Slave 3 FIFO enabled value
 * @see getSlave3FIFOEnabled()
 * @see MPU6050.RA_MST_CTRL
 */
MPU6050.prototype.setSlave3FIFOEnabled = function(enabled) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.SLV_3_FIFO_EN_BIT, enabled);
};
/** Get slave read/write transition enabled value.
 * The I2C_MST_P_NSR bit configures the I2C Master's transition from one slave
 * read to the next slave read. If the bit equals 0, there will be a restart
 * between reads. If the bit equals 1, there will be a stop followed by a start
 * of the following read. When a write transaction follows a read transaction,
 * the stop followed by a start of the successive write will be always used.
 *
 * @return Current slave read/write transition enabled value
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.getSlaveReadWriteTransitionEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.I2C_MST_P_NSR_BIT, callback);
};
/** Set slave read/write transition enabled value.
 * @param enabled New slave read/write transition enabled value
 * @see getSlaveReadWriteTransitionEnabled()
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.setSlaveReadWriteTransitionEnabled = function(enabled) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_MST_CTRL, MPU6050.I2C_MST_P_NSR_BIT, enabled);
};
/** Get I2C master clock speed.
 * I2C_MST_CLK is a 4 bit unsigned value which configures a divider on the
 * MPU-60X0 internal 8MHz clock. It sets the I2C master clock speed according to
 * the following table:
 *
 * <pre>
 * I2C_MST_CLK | I2C Master Clock Speed | 8MHz Clock Divider
 * ------------+------------------------+-------------------
 * 0           | 348kHz                 | 23
 * 1           | 333kHz                 | 24
 * 2           | 320kHz                 | 25
 * 3           | 308kHz                 | 26
 * 4           | 296kHz                 | 27
 * 5           | 286kHz                 | 28
 * 6           | 276kHz                 | 29
 * 7           | 267kHz                 | 30
 * 8           | 258kHz                 | 31
 * 9           | 500kHz                 | 16
 * 10          | 471kHz                 | 17
 * 11          | 444kHz                 | 18
 * 12          | 421kHz                 | 19
 * 13          | 400kHz                 | 20
 * 14          | 381kHz                 | 21
 * 15          | 364kHz                 | 22
 * </pre>
 *
 * @return Current I2C master clock speed
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.getMasterClockSpeed = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_I2C_MST_CTRL, MPU6050.I2C_MST_CLK_BIT, MPU6050.I2C_MST_CLK_LENGTH, callback);
};
/** Set I2C master clock speed.
 * @reparam speed Current I2C master clock speed
 * @see MPU6050.RA_I2C_MST_CTRL
 */
MPU6050.prototype.setMasterClockSpeed = function(speed) {
  this.i2cdev.writeBits(MPU6050.RA_I2C_MST_CTRL, MPU6050.I2C_MST_CLK_BIT, MPU6050.I2C_MST_CLK_LENGTH, speed);
};

// I2C_SLV* registers (Slave 0-3)

/** Get the I2C address of the specified slave (0-3).
 * Note that Bit 7 (MSB) controls read/write mode. If Bit 7 is set, it's a read
 * operation, and if it is cleared, then it's a write operation. The remaining
 * bits (6-0) are the 7-bit device address of the slave device.
 *
 * In read mode, the result of the read is placed in the lowest available
 * EXT_SENS_DATA register. For further information regarding the allocation of
 * read results, please refer to the EXT_SENS_DATA register description
 * (Registers 73 - 96).
 *
 * The MPU-6050 supports a total of five slaves, but Slave 4 has unique
 * characteristics, and so it has its own functions (getSlave4* and setSlave4*).
 *
 * I2C data transactions are performed at the Sample Rate, as defined in
 * Register 25. The user is responsible for ensuring that I2C data transactions
 * to and from each enabled Slave can be completed within a single period of the
 * Sample Rate.
 *
 * The I2C slave access rate can be reduced relative to the Sample Rate. This
 * reduced access rate is determined by I2C_MST_DLY (Register 52). Whether a
 * slave's access rate is reduced relative to the Sample Rate is determined by
 * I2C_MST_DELAY_CTRL (Register 103).
 *
 * The processing order for the slaves is fixed. The sequence followed for
 * processing the slaves is Slave 0, Slave 1, Slave 2, Slave 3 and Slave 4. If a
 * particular Slave is disabled it will be skipped.
 *
 * Each slave can either be accessed at the sample rate or at a reduced sample
 * rate. In a case where some slaves are accessed at the Sample Rate and some
 * slaves are accessed at the reduced rate, the sequence of accessing the slaves
 * (Slave 0 to Slave 4) is still followed. However, the reduced rate slaves will
 * be skipped if their access rate dictates that they should not be accessed
 * during that particular cycle. For further information regarding the reduced
 * access rate, please refer to Register 52. Whether a slave is accessed at the
 * Sample Rate or at the reduced rate is determined by the Delay Enable bits in
 * Register 103.
 *
 * @param num Slave number (0-3)
 * @return Current address for specified slave
 * @see MPU6050.RA_I2C_SLV0_ADDR
 */
MPU6050.RA_I2C_SLV0_ADDR = 0x25;
MPU6050.RA_I2C_SLV0_REG = 0x26;
MPU6050.RA_I2C_SLV0_CTRL = 0x27;
MPU6050.RA_I2C_SLV1_ADDR = 0x28;
MPU6050.RA_I2C_SLV1_REG = 0x29;
MPU6050.RA_I2C_SLV1_CTRL = 0x2A;
MPU6050.RA_I2C_SLV2_ADDR = 0x2B;
MPU6050.RA_I2C_SLV2_REG = 0x2C;
MPU6050.RA_I2C_SLV2_CTRL = 0x2D;
MPU6050.RA_I2C_SLV3_ADDR = 0x2E;
MPU6050.RA_I2C_SLV3_REG = 0x2F;
MPU6050.RA_I2C_SLV3_CTRL = 0x30;
MPU6050.RA_I2C_SLV4_ADDR = 0x31;
MPU6050.RA_I2C_SLV4_REG = 0x32;
MPU6050.RA_I2C_SLV4_DO = 0x33;
MPU6050.RA_I2C_SLV4_CTRL = 0x34;
MPU6050.RA_I2C_SLV4_DI = 0x35;

MPU6050.I2C_SLV_RW_BIT = 7;
MPU6050.I2C_SLV_ADDR_BIT = 6;
MPU6050.I2C_SLV_ADDR_LENGTH = 7;
MPU6050.I2C_SLV_EN_BIT = 7;
MPU6050.I2C_SLV_BYTE_SW_BIT = 6;
MPU6050.I2C_SLV_REG_DIS_BIT = 5;
MPU6050.I2C_SLV_GRP_BIT = 4;
MPU6050.I2C_SLV_LEN_BIT = 3;
MPU6050.I2C_SLV_LEN_LENGTH = 4;

MPU6050.I2C_SLV4_RW_BIT = 7;
MPU6050.I2C_SLV4_ADDR_BIT = 6;
MPU6050.I2C_SLV4_ADDR_LENGTH = 7;
MPU6050.I2C_SLV4_EN_BIT = 7;
MPU6050.I2C_SLV4_INT_EN_BIT = 6;
MPU6050.I2C_SLV4_REG_DIS_BIT = 5;
MPU6050.I2C_SLV4_MST_DLY_BIT = 4;
MPU6050.I2C_SLV4_MST_DLY_LENGTH = 5;

MPU6050.prototype.getSlaveAddress = function(num, callback) {
  this.i2cdev.readByte(MPU6050.RA_I2C_SLV0_ADDR + Math.abs(num%4)*3, callback);
};
/** Set the I2C address of the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param address New address for specified slave
 * @see getSlaveAddress()
 * @see MPU6050.RA_I2C_SLV0_ADDR
 */
MPU6050.prototype.setSlaveAddress = function(num, address, callback) {
  this.i2cdev.writeByte(MPU6050.RA_I2C_SLV0_ADDR + Math.abs(num%4)*3, address, callback);
};
/** Get the active internal register for the specified slave (0-3).
 * Read/write operations for this slave will be done to whatever internal
 * register address is stored in this MPU register.
 *
 * The MPU-6050 supports a total of five slaves, but Slave 4 has unique
 * characteristics, and so it has its own functions.
 *
 * @param num Slave number (0-3)
 * @return Current active register for specified slave
 * @see MPU6050.RA_I2C_SLV0_REG
 */
MPU6050.prototype.getSlaveRegister = function(num, callback) {
  this.i2cdev.readByte(MPU6050.RA_I2C_SLV0_REG + Math.abs(num%4)*3, callback);
};
/** Set the active internal register for the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param reg New active register for specified slave
 * @see getSlaveRegister()
 * @see MPU6050.RA_I2C_SLV0_REG
 */
MPU6050.prototype.setSlaveRegister = function(num, reg, callback) {
  this.i2cdev.writeByte(MPU6050.RA_I2C_SLV0_REG + Math.abs(num%4)*3, reg, callback);
};
/** Get the enabled value for the specified slave (0-3).
 * When set to 1, this bit enables Slave 0 for data transfer operations. When
 * cleared to 0, this bit disables Slave 0 from data transfer operations.
 * @param num Slave number (0-3)
 * @return Current enabled value for specified slave
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.getSlaveEnabled = function(num, callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_EN_BIT, callback);
};
/** Set the enabled value for the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param enabled New enabled value for specified slave
 * @see getSlaveEnabled()
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.setSlaveEnabled = function(num, enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_EN_BIT, enabled, callback);
};
/** Get word pair byte-swapping enabled for the specified slave (0-3).
 * When set to 1, this bit enables byte swapping. When byte swapping is enabled,
 * the high and low bytes of a word pair are swapped. Please refer to
 * I2C_SLV0_GRP for the pairing convention of the word pairs. When cleared to 0,
 * bytes transferred to and from Slave 0 will be written to EXT_SENS_DATA
 * registers in the order they were transferred.
 *
 * @param num Slave number (0-3)
 * @return Current word pair byte-swapping enabled value for specified slave
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.getSlaveWordByteSwap = function(num, callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_BYTE_SW_BIT, callback);
};
/** Set word pair byte-swapping enabled for the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param enabled New word pair byte-swapping enabled value for specified slave
 * @see getSlaveWordByteSwap()
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.setSlaveWordByteSwap = function(num, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_BYTE_SW_BIT, enabled, callback);
};
/** Get write mode for the specified slave (0-3).
 * When set to 1, the transaction will read or write data only. When cleared to
 * 0, the transaction will write a register address prior to reading or writing
 * data. This should equal 0 when specifying the register address within the
 * Slave device to/from which the ensuing data transaction will take place.
 *
 * @param num Slave number (0-3)
 * @return Current write mode for specified slave (0 = register address + data, 1 = data only)
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.getSlaveWriteMode = function(num, callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_REG_DIS_BIT, callback);
};
/** Set write mode for the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param mode New write mode for specified slave (0 = register address + data, 1 = data only)
 * @see getSlaveWriteMode()
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.setSlaveWriteMode = function(num, mode, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_REG_DIS_BIT, mode, callback);
};
/** Get word pair grouping order offset for the specified slave (0-3).
 * This sets specifies the grouping order of word pairs received from registers.
 * When cleared to 0, bytes from register addresses 0 and 1, 2 and 3, etc (even,
 * then odd register addresses) are paired to form a word. When set to 1, bytes
 * from register addresses are paired 1 and 2, 3 and 4, etc. (odd, then even
 * register addresses) are paired to form a word.
 *
 * @param num Slave number (0-3)
 * @return Current word pair grouping order offset for specified slave
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.getSlaveWordGroupOffset = function(num, callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_GRP_BIT, callback);
};
/** Set word pair grouping order offset for the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param enabled New word pair grouping order offset for specified slave
 * @see getSlaveWordGroupOffset()
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.setSlaveWordGroupOffset = function(num, enabled) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_GRP_BIT, enabled);
};
/** Get number of bytes to read for the specified slave (0-3).
 * Specifies the number of bytes transferred to and from Slave 0. Clearing this
 * bit to 0 is equivalent to disabling the register by writing 0 to I2C_SLV0_EN.
 * @param num Slave number (0-3)
 * @return Number of bytes to read for specified slave
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.getSlaveDataLength = function(num, callback) {
  this.i2cdev.readBits(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_LEN_BIT, MPU6050.I2C_SLV_LEN_LENGTH, callback);
};
/** Set number of bytes to read for the specified slave (0-3).
 * @param num Slave number (0-3)
 * @param length Number of bytes to read for specified slave
 * @see getSlaveDataLength()
 * @see MPU6050.RA_I2C_SLV0_CTRL
 */
MPU6050.prototype.setSlaveDataLength = function(num, length, callback) {
  this.i2cdev.writeBits(MPU6050.RA_I2C_SLV0_CTRL + Math.abs(num%4)*3, MPU6050.I2C_SLV_LEN_BIT, MPU6050.I2C_SLV_LEN_LENGTH, length, callback);
};

// I2C_SLV* registers (Slave 4)

/** Get the I2C address of Slave 4.
 * Note that Bit 7 (MSB) controls read/write mode. If Bit 7 is set, it's a read
 * operation, and if it is cleared, then it's a write operation. The remaining
 * bits (6-0) are the 7-bit device address of the slave device.
 *
 * @return Current address for Slave 4
 * @see getSlaveAddress()
 * @see MPU6050.RA_I2C_SLV4_ADDR
 */
MPU6050.prototype.getSlave4Address = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_I2C_SLV4_ADDR, callback);
};
/** Set the I2C address of Slave 4.
 * @param address New address for Slave 4
 * @see getSlave4Address()
 * @see MPU6050.RA_I2C_SLV4_ADDR
 */
MPU6050.prototype.setSlave4Address = function(address, callback) {
  this.i2cdev.writeByte(MPU6050.RA_I2C_SLV4_ADDR, address, callback);
};
/** Get the active internal register for the Slave 4.
 * Read/write operations for this slave will be done to whatever internal
 * register address is stored in this MPU register.
 *
 * @return Current active register for Slave 4
 * @see MPU6050.RA_I2C_SLV4_REG
 */
MPU6050.prototype.getSlave4Register = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_I2C_SLV4_REG, callback);
};
/** Set the active internal register for Slave 4.
 * @param reg New active register for Slave 4
 * @see getSlave4Register()
 * @see MPU6050.RA_I2C_SLV4_REG
 */
MPU6050.prototype.setSlave4Register = function(reg) {
  this.i2cdev.writeByte(MPU6050.RA_I2C_SLV4_REG, reg);
};
/** Set new byte to write to Slave 4.
 * This register stores the data to be written into the Slave 4. If I2C_SLV4_RW
 * is set 1 (set to read), this register has no effect.
 * @param data New byte to write to Slave 4
 * @see MPU6050.RA_I2C_SLV4_DO
 */
MPU6050.prototype.setSlave4OutputByte = function(data, callback) {
  this.i2cdev.writeByte(MPU6050.RA_I2C_SLV4_DO, data, callback);
};
/** Get the enabled value for the Slave 4.
 * When set to 1, this bit enables Slave 4 for data transfer operations. When
 * cleared to 0, this bit disables Slave 4 from data transfer operations.
 * @return Current enabled value for Slave 4
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.getSlave4Enabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_EN_BIT, callback);
};
/** Set the enabled value for Slave 4.
 * @param enabled New enabled value for Slave 4
 * @see getSlave4Enabled()
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.setSlave4Enabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_EN_BIT, enabled, callback);
};
/** Get the enabled value for Slave 4 transaction interrupts.
 * When set to 1, this bit enables the generation of an interrupt signal upon
 * completion of a Slave 4 transaction. When cleared to 0, this bit disables the
 * generation of an interrupt signal upon completion of a Slave 4 transaction.
 * The interrupt status can be observed in Register 54.
 *
 * @return Current enabled value for Slave 4 transaction interrupts.
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.getSlave4InterruptEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_INT_EN_BIT, callback);
};
/** Set the enabled value for Slave 4 transaction interrupts.
 * @param enabled New enabled value for Slave 4 transaction interrupts.
 * @see getSlave4InterruptEnabled()
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.setSlave4InterruptEnabled = function(enabled) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_INT_EN_BIT, enabled);
};
/** Get write mode for Slave 4.
 * When set to 1, the transaction will read or write data only. When cleared to
 * 0, the transaction will write a register address prior to reading or writing
 * data. This should equal 0 when specifying the register address within the
 * Slave device to/from which the ensuing data transaction will take place.
 *
 * @return Current write mode for Slave 4 (0 = register address + data, 1 = data only)
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.getSlave4WriteMode = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_REG_DIS_BIT, callback);
};
/** Set write mode for the Slave 4.
 * @param mode New write mode for Slave 4 (0 = register address + data, 1 = data only)
 * @see getSlave4WriteMode()
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.setSlave4WriteMode = function(mode, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_REG_DIS_BIT, mode, callback);
};
/** Get Slave 4 master delay value.
 * This configures the reduced access rate of I2C slaves relative to the Sample
 * Rate. When a slave's access rate is decreased relative to the Sample Rate,
 * the slave is accessed every:
 *
 *     1 / (1 + I2C_MST_DLY) samples
 *
 * This base Sample Rate in turn is determined by SMPLRT_DIV (register 25) and
 * DLPF_CFG (register 26). Whether a slave's access rate is reduced relative to
 * the Sample Rate is determined by I2C_MST_DELAY_CTRL (register 103). For
 * further information regarding the Sample Rate, please refer to register 25.
 *
 * @return Current Slave 4 master delay value
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.getSlave4MasterDelay = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_MST_DLY_BIT, MPU6050.I2C_SLV4_MST_DLY_LENGTH, callback);
};
/** Set Slave 4 master delay value.
 * @param delay New Slave 4 master delay value
 * @see getSlave4MasterDelay()
 * @see MPU6050.RA_I2C_SLV4_CTRL
 */
MPU6050.prototype.setSlave4MasterDelay = function(delay, callback) {
  this.i2cdev.writeBits(MPU6050.RA_I2C_SLV4_CTRL, MPU6050.I2C_SLV4_MST_DLY_BIT, MPU6050.I2C_SLV4_MST_DLY_LENGTH, delay, callback);
};
/** Get last available byte read from Slave 4.
 * This register stores the data read from Slave 4. This field is populated
 * after a read transaction.
 * @return Last available byte read from to Slave 4
 * @see MPU6050.RA_I2C_SLV4_DI
 */
MPU6050.prototype.getSlave4InputByte = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_I2C_SLV4_DI, callback);
};

// I2C_MST_STATUS register

/** Get FSYNC interrupt status.
 * This bit reflects the status of the FSYNC interrupt from an external device
 * into the MPU-60X0. This is used as a way to pass an external interrupt
 * through the MPU-60X0 to the host application processor. When set to 1, this
 * bit will cause an interrupt if FSYNC_INT_EN is asserted in INT_PIN_CFG
 * (Register 55).
 * @return FSYNC interrupt status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getPassthroughStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_PASS_THROUGH_BIT, callback);
};
/** Get Slave 4 transaction done status.
 * Automatically sets to 1 when a Slave 4 transaction has completed. This
 * triggers an interrupt if the I2C_MST_INT_EN bit in the INT_ENABLE register
 * (Register 56) is asserted and if the SLV_4_DONE_INT bit is asserted in the
 * I2C_SLV4_CTRL register (Register 52).
 * @return Slave 4 transaction done status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getSlave4TransactionDoneStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_SLV4_DONE_BIT, callback);
};
/** Get master arbitration lost status.
 * This bit automatically sets to 1 when the I2C Master has lost arbitration of
 * the auxiliary I2C bus (an error condition). This triggers an interrupt if the
 * I2C_MST_INT_EN bit in the INT_ENABLE register (Register 56) is asserted.
 * @return Master arbitration lost status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getLostArbitration = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_LOST_ARB_BIT, callback);
};
/** Get Slave 4 NACK status.
 * This bit automatically sets to 1 when the I2C Master receives a NACK in a
 * transaction with Slave 4. This triggers an interrupt if the I2C_MST_INT_EN
 * bit in the INT_ENABLE register (Register 56) is asserted.
 * @return Slave 4 NACK interrupt status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getSlave4Nack = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_SLV4_NACK_BIT, callback);
};
/** Get Slave 3 NACK status.
 * This bit automatically sets to 1 when the I2C Master receives a NACK in a
 * transaction with Slave 3. This triggers an interrupt if the I2C_MST_INT_EN
 * bit in the INT_ENABLE register (Register 56) is asserted.
 * @return Slave 3 NACK interrupt status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getSlave3Nack = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_SLV3_NACK_BIT, callback);
};
/** Get Slave 2 NACK status.
 * This bit automatically sets to 1 when the I2C Master receives a NACK in a
 * transaction with Slave 2. This triggers an interrupt if the I2C_MST_INT_EN
 * bit in the INT_ENABLE register (Register 56) is asserted.
 * @return Slave 2 NACK interrupt status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getSlave2Nack = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_SLV2_NACK_BIT, callback);
};
/** Get Slave 1 NACK status.
 * This bit automatically sets to 1 when the I2C Master receives a NACK in a
 * transaction with Slave 1. This triggers an interrupt if the I2C_MST_INT_EN
 * bit in the INT_ENABLE register (Register 56) is asserted.
 * @return Slave 1 NACK interrupt status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getSlave1Nack = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_SLV1_NACK_BIT, callback);
};
/** Get Slave 0 NACK status.
 * This bit automatically sets to 1 when the I2C Master receives a NACK in a
 * transaction with Slave 0. This triggers an interrupt if the I2C_MST_INT_EN
 * bit in the INT_ENABLE register (Register 56) is asserted.
 * @return Slave 0 NACK interrupt status
 * @see MPU6050.RA_I2C_MST_STATUS
 */
MPU6050.prototype.getSlave0Nack = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_STATUS, MPU6050.MST_I2C_SLV0_NACK_BIT, callback);
};

// INT_PIN_CFG register

/** Get interrupt logic level mode.
 * Will be set 0 for active-high, 1 for active-low.
 * @return Current interrupt mode (0=active-high, 1=active-low)
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_INT_LEVEL_BIT
 */
MPU6050.prototype.getInterruptMode = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_INT_LEVEL_BIT, callback);
};
/** Set interrupt logic level mode.
 * @param mode New interrupt mode (0=active-high, 1=active-low)
 * @see getInterruptMode()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_INT_LEVEL_BIT
 */
MPU6050.prototype.setInterruptMode = function(mode, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_INT_LEVEL_BIT, mode, callback);
};
/** Get interrupt drive mode.
 * Will be set 0 for push-pull, 1 for open-drain.
 * @return Current interrupt drive mode (0=push-pull, 1=open-drain)
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_INT_OPEN_BIT
 */
MPU6050.prototype.getInterruptDrive = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_INT_OPEN_BIT, callback);
};
/** Set interrupt drive mode.
 * @param drive New interrupt drive mode (0=push-pull, 1=open-drain)
 * @see getInterruptDrive()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_INT_OPEN_BIT
 */
MPU6050.prototype.setInterruptDrive = function(drive, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_INT_OPEN_BIT, drive, callback);
};
/** Get interrupt latch mode.
 * Will be set 0 for 50us-pulse, 1 for latch-until-int-cleared.
 * @return Current latch mode (0=50us-pulse, 1=latch-until-int-cleared)
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_LATCH_INT_EN_BIT
 */
MPU6050.prototype.getInterruptLatch = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_LATCH_INT_EN_BIT, callback);
};
/** Set interrupt latch mode.
 * @param latch New latch mode (0=50us-pulse, 1=latch-until-int-cleared)
 * @see getInterruptLatch()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_LATCH_INT_EN_BIT
 */
MPU6050.prototype.setInterruptLatch = function(latch) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_LATCH_INT_EN_BIT, latch);
};
/** Get interrupt latch clear mode.
 * Will be set 0 for status-read-only, 1 for any-register-read.
 * @return Current latch clear mode (0=status-read-only, 1=any-register-read)
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_INT_RD_CLEAR_BIT
 */
MPU6050.prototype.getInterruptLatchClear = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_INT_RD_CLEAR_BIT, callback);
};
/** Set interrupt latch clear mode.
 * @param clear New latch clear mode (0=status-read-only, 1=any-register-read)
 * @see getInterruptLatchClear()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_INT_RD_CLEAR_BIT
 */
MPU6050.prototype.setInterruptLatchClear = function(clear, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_INT_RD_CLEAR_BIT, clear, callback);
};
/** Get FSYNC interrupt logic level mode.
 * @return Current FSYNC interrupt mode (0=active-high, 1=active-low)
 * @see getFSyncInterruptMode()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_FSYNC_INT_LEVEL_BIT
 */
MPU6050.prototype.getFSyncInterruptLevel = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_FSYNC_INT_LEVEL_BIT, callback);
};
/** Set FSYNC interrupt logic level mode.
 * @param mode New FSYNC interrupt mode (0=active-high, 1=active-low)
 * @see getFSyncInterruptMode()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_FSYNC_INT_LEVEL_BIT
 */
MPU6050.prototype.setFSyncInterruptLevel = function(level) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_FSYNC_INT_LEVEL_BIT, level);
};
/** Get FSYNC pin interrupt enabled setting.
 * Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled setting
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_FSYNC_INT_EN_BIT
 */
MPU6050.prototype.getFSyncInterruptEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_FSYNC_INT_EN_BIT, callback);
};
/** Set FSYNC pin interrupt enabled setting.
 * @param enabled New FSYNC pin interrupt enabled setting
 * @see getFSyncInterruptEnabled()
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_FSYNC_INT_EN_BIT
 */
MPU6050.prototype.setFSyncInterruptEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_FSYNC_INT_EN_BIT, enabled, callback);
};
/** Get I2C bypass enabled status.
 * When this bit is equal to 1 and I2C_MST_EN (Register 106 bit[5]) is equal to
 * 0, the host application processor will be able to directly access the
 * auxiliary I2C bus of the MPU-60X0. When this bit is equal to 0, the host
 * application processor will not be able to directly access the auxiliary I2C
 * bus of the MPU-60X0 regardless of the state of I2C_MST_EN (Register 106
 * bit[5]).
 * @return Current I2C bypass enabled status
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_I2C_BYPASS_EN_BIT
 */
MPU6050.prototype.getI2CBypassEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_I2C_BYPASS_EN_BIT, callback);
};
/** Set I2C bypass enabled status.
 * When this bit is equal to 1 and I2C_MST_EN (Register 106 bit[5]) is equal to
 * 0, the host application processor will be able to directly access the
 * auxiliary I2C bus of the MPU-60X0. When this bit is equal to 0, the host
 * application processor will not be able to directly access the auxiliary I2C
 * bus of the MPU-60X0 regardless of the state of I2C_MST_EN (Register 106
 * bit[5]).
 * @param enabled New I2C bypass enabled status
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_I2C_BYPASS_EN_BIT
 */
MPU6050.prototype.setI2CBypassEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_I2C_BYPASS_EN_BIT, enabled, callback);
};
/** Get reference clock output enabled status.
 * When this bit is equal to 1, a reference clock output is provided at the
 * CLKOUT pin. When this bit is equal to 0, the clock output is disabled. For
 * further information regarding CLKOUT, please refer to the MPU-60X0 Product
 * Specification document.
 * @return Current reference clock output enabled status
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_CLKOUT_EN_BIT
 */
MPU6050.prototype.getClockOutputEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_CLKOUT_EN_BIT, callback);
};
/** Set reference clock output enabled status.
 * When this bit is equal to 1, a reference clock output is provided at the
 * CLKOUT pin. When this bit is equal to 0, the clock output is disabled. For
 * further information regarding CLKOUT, please refer to the MPU-60X0 Product
 * Specification document.
 * @param enabled New reference clock output enabled status
 * @see MPU6050.RA_INT_PIN_CFG
 * @see MPU6050.INTCFG_CLKOUT_EN_BIT
 */
MPU6050.prototype.setClockOutputEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_PIN_CFG, MPU6050.INTCFG_CLKOUT_EN_BIT, enabled, callback);
};

// INT_ENABLE register

/** Get full interrupt enabled status.
 * Full register byte for all interrupts, for quick reading. Each bit will be
 * set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_FF_BIT
 **/
MPU6050.prototype.getIntEnabled = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_INT_ENABLE, callback);
};
/** Set full interrupt enabled status.
 * Full register byte for all interrupts, for quick reading. Each bit should be
 * set 0 for disabled, 1 for enabled.
 * @param enabled New interrupt enabled status
 * @see getIntFreefallEnabled()
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_FF_BIT
 **/
MPU6050.prototype.setIntEnabled = function(enabled, callback) {
  this.i2cdev.writeByte(MPU6050.RA_INT_ENABLE, enabled, callback);
};
/** Get Free Fall interrupt enabled status.
 * Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_FF_BIT
 **/
MPU6050.prototype.getIntFreefallEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_FF_BIT, callback);
};
/** Set Free Fall interrupt enabled status.
 * @param enabled New interrupt enabled status
 * @see getIntFreefallEnabled()
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_FF_BIT
 **/
MPU6050.prototype.setIntFreefallEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_FF_BIT, enabled, callback);
};
/** Get Motion Detection interrupt enabled status.
 * Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_MOT_BIT
 **/
MPU6050.prototype.getIntMotionEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_MOT_BIT, callback);
};
/** Set Motion Detection interrupt enabled status.
 * @param enabled New interrupt enabled status
 * @see getIntMotionEnabled()
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_MOT_BIT
 **/
MPU6050.prototype.setIntMotionEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_MOT_BIT, enabled, callback);
};
/** Get Zero Motion Detection interrupt enabled status.
 * Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_ZMOT_BIT
 **/
MPU6050.prototype.getIntZeroMotionEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_ZMOT_BIT, callback);
};
/** Set Zero Motion Detection interrupt enabled status.
 * @param enabled New interrupt enabled status
 * @see getIntZeroMotionEnabled()
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_ZMOT_BIT
 **/
MPU6050.prototype.setIntZeroMotionEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_ZMOT_BIT, enabled, callback);
};
/** Get FIFO Buffer Overflow interrupt enabled status.
 * Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_FIFO_OFLOW_BIT
 **/
MPU6050.prototype.getIntFIFOBufferOverflowEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_FIFO_OFLOW_BIT, callback);
};
/** Set FIFO Buffer Overflow interrupt enabled status.
 * @param enabled New interrupt enabled status
 * @see getIntFIFOBufferOverflowEnabled()
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_FIFO_OFLOW_BIT
 **/
MPU6050.prototype.setIntFIFOBufferOverflowEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_FIFO_OFLOW_BIT, enabled, callback);
};
/** Get I2C Master interrupt enabled status.
 * This enables any of the I2C Master interrupt sources to generate an
 * interrupt. Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_I2C_MST_INT_BIT
 **/
MPU6050.prototype.getIntI2CMasterEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_I2C_MST_INT_BIT, callback);
};
/** Set I2C Master interrupt enabled status.
 * @param enabled New interrupt enabled status
 * @see getIntI2CMasterEnabled()
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_I2C_MST_INT_BIT
 **/
MPU6050.prototype.setIntI2CMasterEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_I2C_MST_INT_BIT, enabled, callback);
};
/** Get Data Ready interrupt enabled setting.
 * This event occurs each time a write operation to all of the sensor registers
 * has been completed. Will be set 0 for disabled, 1 for enabled.
 * @return Current interrupt enabled status
 * @see MPU6050.RA_INT_ENABLE
 * @see MPU6050.INTERRUPT_DATA_RDY_BIT
 */
MPU6050.prototype.getIntDataReadyEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_DATA_RDY_BIT, callback);
};
/** Set Data Ready interrupt enabled status.
 * @param enabled New interrupt enabled status
 * @see getIntDataReadyEnabled()
 * @see MPU6050.RA_INT_CFG
 * @see MPU6050.INTERRUPT_DATA_RDY_BIT
 */
MPU6050.prototype.setIntDataReadyEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_DATA_RDY_BIT, enabled, callback);
};

// INT_STATUS register

/** Get full set of interrupt status bits.
 * These bits clear to 0 after the register has been read. Very useful
 * for getting multiple INT statuses, since each single bit read clears
 * all of them because it has to read the whole byte.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 */
MPU6050.prototype.getIntStatus = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_INT_STATUS, callback);
};
/** Get Free Fall interrupt status.
 * This bit automatically sets to 1 when a Free Fall interrupt has been
 * generated. The bit clears to 0 after the register has been read.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 * @see MPU6050.INTERRUPT_FF_BIT
 */
MPU6050.prototype.getIntFreefallStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_FF_BIT, callback);
};
/** Get Motion Detection interrupt status.
 * This bit automatically sets to 1 when a Motion Detection interrupt has been
 * generated. The bit clears to 0 after the register has been read.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 * @see MPU6050.INTERRUPT_MOT_BIT
 */
MPU6050.prototype.getIntMotionStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_MOT_BIT, callback);
};
/** Get Zero Motion Detection interrupt status.
 * This bit automatically sets to 1 when a Zero Motion Detection interrupt has
 * been generated. The bit clears to 0 after the register has been read.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 * @see MPU6050.INTERRUPT_ZMOT_BIT
 */
MPU6050.prototype.getIntZeroMotionStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_ZMOT_BIT, callback);
};
/** Get FIFO Buffer Overflow interrupt status.
 * This bit automatically sets to 1 when a Free Fall interrupt has been
 * generated. The bit clears to 0 after the register has been read.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 * @see MPU6050.INTERRUPT_FIFO_OFLOW_BIT
 */
MPU6050.prototype.getIntFIFOBufferOverflowStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_FIFO_OFLOW_BIT, callback);
};
/** Get I2C Master interrupt status.
 * This bit automatically sets to 1 when an I2C Master interrupt has been
 * generated. For a list of I2C Master interrupts, please refer to Register 54.
 * The bit clears to 0 after the register has been read.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 * @see MPU6050.INTERRUPT_I2C_MST_INT_BIT
 */
MPU6050.prototype.getIntI2CMasterStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_I2C_MST_INT_BIT, callback);
};
/** Get Data Ready interrupt status.
 * This bit automatically sets to 1 when a Data Ready interrupt has been
 * generated. The bit clears to 0 after the register has been read.
 * @return Current interrupt status
 * @see MPU6050.RA_INT_STATUS
 * @see MPU6050.INTERRUPT_DATA_RDY_BIT
 */
MPU6050.prototype.getIntDataReadyStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_DATA_RDY_BIT, callback);
};

// ACCEL_*OUT_* registers

/** Get raw 9-axis motion sensor readings (accel/gyro/compass).
 * FUNCTION NOT FULLY IMPLEMENTED YET.
 * @param ax 16-bit signed integer container for accelerometer X-axis value
 * @param ay 16-bit signed integer container for accelerometer Y-axis value
 * @param az 16-bit signed integer container for accelerometer Z-axis value
 * @param gx 16-bit signed integer container for gyroscope X-axis value
 * @param gy 16-bit signed integer container for gyroscope Y-axis value
 * @param gz 16-bit signed integer container for gyroscope Z-axis value
 * @param mx 16-bit signed integer container for magnetometer X-axis value
 * @param my 16-bit signed integer container for magnetometer Y-axis value
 * @param mz 16-bit signed integer container for magnetometer Z-axis value
 * @see getMotion6()
 * @see getAcceleration()
 * @see getRotation()
 * @see MPU6050.RA_ACCEL_XOUT_H
 */
//MPU6050.prototype.getMotion9 = function(ax,  ay,  az,  gx,  gy,  gz,  mx,  my,  mz) {
//  this.getMotion6(ax, ay, az, gx, gy, gz);
//  // TODO: magnetometer integration
//};
/** Get raw 6-axis motion sensor readings (accel/gyro).
 * Retrieves all currently available motion sensor values.
 * @param ax 16-bit signed integer container for accelerometer X-axis value
 * @param ay 16-bit signed integer container for accelerometer Y-axis value
 * @param az 16-bit signed integer container for accelerometer Z-axis value
 * @param gx 16-bit signed integer container for gyroscope X-axis value
 * @param gy 16-bit signed integer container for gyroscope Y-axis value
 * @param gz 16-bit signed integer container for gyroscope Z-axis value
 * @see getAcceleration()
 * @see getRotation()
 * @see MPU6050.RA_ACCEL_XOUT_H
 */
//MPU6050.prototype.getMotion6 = function(ax,  ay,  az,  gx,  gy,  gz) {
//  this.i2cdev.readBytes(MPU6050.RA_ACCEL_XOUT_H, 14, callback);
//  ax = ((buffer[0]) << 8) | buffer[1];
//  ay = ((buffer[2]) << 8) | buffer[3];
//  az = ((buffer[4]) << 8) | buffer[5];
//  gx = ((buffer[8]) << 8) | buffer[9];
//  gy = ((buffer[10]) << 8) | buffer[11];
//  gz = ((buffer[12]) << 8) | buffer[13];
//};
/** Get 3-axis accelerometer readings.
 * These registers store the most recent accelerometer measurements.
 * Accelerometer measurements are written to these registers at the Sample Rate
 * as defined in Register 25.
 *
 * The accelerometer measurement registers, along with the temperature
 * measurement registers, gyroscope measurement registers, and external sensor
 * data registers, are composed of two sets of registers: an internal register
 * set and a user-facing read register set.
 *
 * The data within the accelerometer sensors' internal register set is always
 * updated at the Sample Rate. Meanwhile, the user-facing read register set
 * duplicates the internal register set's data values whenever the serial
 * interface is idle. This guarantees that a burst read of sensor registers will
 * read measurements from the same sampling instant. Note that if burst reads
 * are not used, the user is responsible for ensuring a set of single byte reads
 * correspond to a single sampling instant by checking the Data Ready interrupt.
 *
 * Each 16-bit accelerometer measurement has a full scale defined in ACCEL_FS
 * (Register 28). For each full scale setting, the accelerometers' sensitivity
 * per LSB in ACCEL_xOUT is shown in the table below:
 *
 * <pre>
 * AFS_SEL | Full Scale Range | LSB Sensitivity
 * --------+------------------+----------------
 * 0       | +/- 2g           | 8192 LSB/mg
 * 1       | +/- 4g           | 4096 LSB/mg
 * 2       | +/- 8g           | 2048 LSB/mg
 * 3       | +/- 16g          | 1024 LSB/mg
 * </pre>
 *
 * @param x 16-bit signed integer container for X-axis acceleration
 * @param y 16-bit signed integer container for Y-axis acceleration
 * @param z 16-bit signed integer container for Z-axis acceleration
 * @see MPU6050.RA_GYRO_XOUT_H
 */
//MPU6050.prototype.getAcceleration = function(x, y, z) {
//  this.i2cdev.readBytes(MPU6050.RA_ACCEL_XOUT_H, 6, callback);
//  x = ((buffer[0]) << 8) | buffer[1];
//  y = ((buffer[2]) << 8) | buffer[3];
//  z = ((buffer[4]) << 8) | buffer[5];
//};
/** Get X-axis accelerometer reading.
 * @return X-axis acceleration measurement in 16-bit 2's complement format
 * @see getMotion6()
 * @see MPU6050.RA_ACCEL_XOUT_H
 */
MPU6050.prototype.getAccelerationX = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ACCEL_XOUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
/** Get Y-axis accelerometer reading.
 * @return Y-axis acceleration measurement in 16-bit 2's complement format
 * @see getMotion6()
 * @see MPU6050.RA_ACCEL_YOUT_H
 */
MPU6050.prototype.getAccelerationY = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ACCEL_YOUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
/** Get Z-axis accelerometer reading.
 * @return Z-axis acceleration measurement in 16-bit 2's complement format
 * @see getMotion6()
 * @see MPU6050.RA_ACCEL_ZOUT_H
 */
MPU6050.prototype.getAccelerationZ = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ACCEL_ZOUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};

// TEMP_OUT_* registers

/** Get current internal temperature.
 * @return Temperature reading in 16-bit 2's complement format
 * @see MPU6050.RA_TEMP_OUT_H
 */
MPU6050.RA_TEMP_OUT_H = 0x41;

MPU6050.prototype.getTemperature = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_TEMP_OUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};

// GYRO_*OUT_* registers

/** Get 3-axis gyroscope readings.
 * These gyroscope measurement registers, along with the accelerometer
 * measurement registers, temperature measurement registers, and external sensor
 * data registers, are composed of two sets of registers: an internal register
 * set and a user-facing read register set.
 * The data within the gyroscope sensors' internal register set is always
 * updated at the Sample Rate. Meanwhile, the user-facing read register set
 * duplicates the internal register set's data values whenever the serial
 * interface is idle. This guarantees that a burst read of sensor registers will
 * read measurements from the same sampling instant. Note that if burst reads
 * are not used, the user is responsible for ensuring a set of single byte reads
 * correspond to a single sampling instant by checking the Data Ready interrupt.
 *
 * Each 16-bit gyroscope measurement has a full scale defined in FS_SEL
 * (Register 27). For each full scale setting, the gyroscopes' sensitivity per
 * LSB in GYRO_xOUT is shown in the table below:
 *
 * <pre>
 * FS_SEL | Full Scale Range   | LSB Sensitivity
 * -------+--------------------+----------------
 * 0      | +/- 250 degrees/s  | 131 LSB/deg/s
 * 1      | +/- 500 degrees/s  | 65.5 LSB/deg/s
 * 2      | +/- 1000 degrees/s | 32.8 LSB/deg/s
 * 3      | +/- 2000 degrees/s | 16.4 LSB/deg/s
 * </pre>
 *
 * @param x 16-bit signed integer container for X-axis rotation
 * @param y 16-bit signed integer container for Y-axis rotation
 * @param z 16-bit signed integer container for Z-axis rotation
 * @see getMotion6()
 * @see MPU6050.RA_GYRO_XOUT_H
 */
//MPU6050.prototype.getRotation = function( x,  y,  z) {
//  this.i2cdev.readBytes(MPU6050.RA_GYRO_XOUT_H, 6, callback);
//  x = ((buffer[0]) << 8) | buffer[1];
//  y = ((buffer[2]) << 8) | buffer[3];
//  z = ((buffer[4]) << 8) | buffer[5];
//};
/** Get X-axis gyroscope reading.
 * @return X-axis rotation measurement in 16-bit 2's complement format
 * @see getMotion6()
 * @see MPU6050.RA_GYRO_XOUT_H
 */
MPU6050.prototype.getRotationX = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_GYRO_XOUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
/** Get Y-axis gyroscope reading.
 * @return Y-axis rotation measurement in 16-bit 2's complement format
 * @see getMotion6()
 * @see MPU6050.RA_GYRO_YOUT_H
 */
MPU6050.prototype.getRotationY = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_GYRO_YOUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
/** Get Z-axis gyroscope reading.
 * @return Z-axis rotation measurement in 16-bit 2's complement format
 * @see getMotion6()
 * @see MPU6050.RA_GYRO_ZOUT_H
 */
MPU6050.prototype.getRotationZ = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_GYRO_ZOUT_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};

// EXT_SENS_DATA_* registers
MPU6050.RA_EXT_SENS_DATA_00 = 0x49;
MPU6050.RA_EXT_SENS_DATA_01 = 0x4A;
MPU6050.RA_EXT_SENS_DATA_02 = 0x4B;
MPU6050.RA_EXT_SENS_DATA_03 = 0x4C;
MPU6050.RA_EXT_SENS_DATA_04 = 0x4D;
MPU6050.RA_EXT_SENS_DATA_05 = 0x4E;
MPU6050.RA_EXT_SENS_DATA_06 = 0x4F;
MPU6050.RA_EXT_SENS_DATA_07 = 0x50;
MPU6050.RA_EXT_SENS_DATA_08 = 0x51;
MPU6050.RA_EXT_SENS_DATA_09 = 0x52;
MPU6050.RA_EXT_SENS_DATA_10 = 0x53;
MPU6050.RA_EXT_SENS_DATA_11 = 0x54;
MPU6050.RA_EXT_SENS_DATA_12 = 0x55;
MPU6050.RA_EXT_SENS_DATA_13 = 0x56;
MPU6050.RA_EXT_SENS_DATA_14 = 0x57;
MPU6050.RA_EXT_SENS_DATA_15 = 0x58;
MPU6050.RA_EXT_SENS_DATA_16 = 0x59;
MPU6050.RA_EXT_SENS_DATA_17 = 0x5A;
MPU6050.RA_EXT_SENS_DATA_18 = 0x5B;
MPU6050.RA_EXT_SENS_DATA_19 = 0x5C;
MPU6050.RA_EXT_SENS_DATA_20 = 0x5D;
MPU6050.RA_EXT_SENS_DATA_21 = 0x5E;
MPU6050.RA_EXT_SENS_DATA_22 = 0x5F;
MPU6050.RA_EXT_SENS_DATA_23 = 0x60;

/** Read single byte from external sensor data register.
 * These registers store data read from external sensors by the Slave 0, 1, 2,
 * and 3 on the auxiliary I2C interface. Data read by Slave 4 is stored in
 * I2C_SLV4_DI (Register 53).
 *
 * External sensor data is written to these registers at the Sample Rate as
 * defined in Register 25. This access rate can be reduced by using the Slave
 * Delay Enable registers (Register 103).
 *
 * External sensor data registers, along with the gyroscope measurement
 * registers, accelerometer measurement registers, and temperature measurement
 * registers, are composed of two sets of registers: an internal register set
 * and a user-facing read register set.
 *
 * The data within the external sensors' internal register set is always updated
 * at the Sample Rate (or the reduced access rate) whenever the serial interface
 * is idle. This guarantees that a burst read of sensor registers will read
 * measurements from the same sampling instant. Note that if burst reads are not
 * used, the user is responsible for ensuring a set of single byte reads
 * correspond to a single sampling instant by checking the Data Ready interrupt.
 *
 * Data is placed in these external sensor data registers according to
 * I2C_SLV0_CTRL, I2C_SLV1_CTRL, I2C_SLV2_CTRL, and I2C_SLV3_CTRL (Registers 39,
 * 42, 45, and 48). When more than zero bytes are read (I2C_SLVx_LEN > 0) from
 * an enabled slave (I2C_SLVx_EN = 1), the slave is read at the Sample Rate (as
 * defined in Register 25) or delayed rate (if specified in Register 52 and
 * 103). During each Sample cycle, slave reads are performed in order of Slave
 * number. If all slaves are enabled with more than zero bytes to be read, the
 * order will be Slave 0, followed by Slave 1, Slave 2, and Slave 3.
 *
 * Each enabled slave will have EXT_SENS_DATA registers associated with it by
 * number of bytes read (I2C_SLVx_LEN) in order of slave number, starting from
 * EXT_SENS_DATA_00. Note that this means enabling or disabling a slave may
 * change the higher numbered slaves' associated registers. Furthermore, if
 * fewer total bytes are being read from the external sensors as a result of
 * such a change, then the data remaining in the registers which no longer have
 * an associated slave device (i.e. high numbered registers) will remain in
 * these previously allocated registers unless reset.
 *
 * If the sum of the read lengths of all SLVx transactions exceed the number of
 * available EXT_SENS_DATA registers, the excess bytes will be dropped. There
 * are 24 EXT_SENS_DATA registers and hence the total read lengths between all
 * the slaves cannot be greater than 24 or some bytes will be lost.
 *
 * Note: Slave 4's behavior is distinct from that of Slaves 0-3. For further
 * information regarding the characteristics of Slave 4, please refer to
 * Registers 49 to 53.
 *
 * EXAMPLE:
 * Suppose that Slave 0 is enabled with 4 bytes to be read (I2C_SLV0_EN = 1 and
 * I2C_SLV0_LEN = 4) while Slave 1 is enabled with 2 bytes to be read so that
 * I2C_SLV1_EN = 1 and I2C_SLV1_LEN = 2. In such a situation, EXT_SENS_DATA _00
 * through _03 will be associated with Slave 0, while EXT_SENS_DATA _04 and 05
 * will be associated with Slave 1. If Slave 2 is enabled as well, registers
 * starting from EXT_SENS_DATA_06 will be allocated to Slave 2.
 *
 * If Slave 2 is disabled while Slave 3 is enabled in this same situation, then
 * registers starting from EXT_SENS_DATA_06 will be allocated to Slave 3
 * instead.
 *
 * REGISTER ALLOCATION FOR DYNAMIC DISABLE VS. NORMAL DISABLE:
 * If a slave is disabled at any time, the space initially allocated to the
 * slave in the EXT_SENS_DATA register, will remain associated with that slave.
 * This is to avoid dynamic adjustment of the register allocation.
 *
 * The allocation of the EXT_SENS_DATA registers is recomputed only when (1) all
 * slaves are disabled, or (2) the I2C_MST_RST bit is set (Register 106).
 *
 * This above is also true if one of the slaves gets NACKed and stops
 * functioning.
 *
 * @param position Starting position (0-23)
 * @return Byte read from register
 */
MPU6050.prototype.getExternalSensorByte = function(position, callback) {
  this.i2cdev.readByte(MPU6050.RA_EXT_SENS_DATA_00 + position, callback);
};
/** Read word (2 bytes) from external sensor data registers.
 * @param position Starting position (0-21)
 * @return Word read from register
 * @see getExternalSensorByte()
 */
MPU6050.prototype.getExternalSensorWord = function(position, callback) {
  this.i2cdev.readBytes(MPU6050.RA_EXT_SENS_DATA_00 + position, 2, function(err, buffer) {
    //UNTESTED - encoding might be [ascii, utf8, utf16le, ucs2, base64, binary, hex]
    callback(err, buffer.toString('ascii', 0, 2));
  });
};
/** Read double word (4 bytes) from external sensor data registers.
 * @param position Starting position (0-20)
 * @return Double word read from registers
 * @see getExternalSensorByte()
 */
MPU6050.prototype.getExternalSensorDWord = function(position, callback) {
  this.i2cdev.readBytes(MPU6050.RA_EXT_SENS_DATA_00 + position, 4, function(err, buffer) {
    //UNTESTED - encoding might be [ascii, utf8, utf16le, ucs2, base64, binary, hex]
    callback(err, buffer.toString('ascii', 0, 4));
  });
};

// MOT_DETECT_STATUS register
MPU6050.RA_MOT_DETECT_STATUS = 0x61;

MPU6050.MOTION_MOT_XNEG_BIT = 7;
MPU6050.MOTION_MOT_XPOS_BIT = 6;
MPU6050.MOTION_MOT_YNEG_BIT = 5;
MPU6050.MOTION_MOT_YPOS_BIT = 4;
MPU6050.MOTION_MOT_ZNEG_BIT = 3;
MPU6050.MOTION_MOT_ZPOS_BIT = 2;
MPU6050.MOTION_MOT_ZRMOT_BIT = 0;

/** Get full motion detection status register content (all bits).
 * @return Motion detection status byte
 * @see MPU6050.RA_MOT_DETECT_STATUS
 */
MPU6050.prototype.getMotionStatus = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_MOT_DETECT_STATUS, callback);
};
/** Get X-axis negative motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_XNEG_BIT
 */
MPU6050.prototype.getXNegMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_XNEG_BIT, callback);
};
/** Get X-axis positive motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_XPOS_BIT
 */
MPU6050.prototype.getXPosMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_XPOS_BIT, callback);
};
/** Get Y-axis negative motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_YNEG_BIT
 */
MPU6050.prototype.getYNegMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_YNEG_BIT, callback);
};
/** Get Y-axis positive motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_YPOS_BIT
 */
MPU6050.prototype.getYPosMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_YPOS_BIT, callback);

}
/** Get Z-axis negative motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_ZNEG_BIT
 */
MPU6050.prototype.getZNegMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_ZNEG_BIT, callback);
};
/** Get Z-axis positive motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_ZPOS_BIT
 */
MPU6050.prototype.getZPosMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_ZPOS_BIT, callback);
};
/** Get zero motion detection interrupt status.
 * @return Motion detection status
 * @see MPU6050.RA_MOT_DETECT_STATUS
 * @see MPU6050.MOTION_MOT_ZRMOT_BIT
 */
MPU6050.prototype.getZeroMotionDetected = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_MOT_DETECT_STATUS, MPU6050.MOTION_MOT_ZRMOT_BIT, callback);
};

// I2C_SLV*_DO register

/** Write byte to Data Output container for specified slave.
 * This register holds the output data written into Slave when Slave is set to
 * write mode. For further information regarding Slave control, please
 * refer to Registers 37 to 39 and immediately following.
 * @param num Slave number (0-3)
 * @param data Byte to write
 * @see MPU6050.RA_I2C_SLV0_DO
 */
MPU6050.RA_I2C_SLV0_DO = 0x63;

MPU6050.prototype.setSlaveOutputByte = function(num, data, callback) {
  this.i2cdev.writeByte(MPU6050.RA_I2C_SLV0_DO + Math.abs(num%4), data, callback);
};

// I2C_MST_DELAY_CTRL register
MPU6050.RA_I2C_MST_DELAY_CTRL = 0x67;

MPU6050.DELAYCTRL_DELAY_ES_SHADOW_BIT = 7;
MPU6050.DELAYCTRL_I2C_SLV4_DLY_EN_BIT = 4;
MPU6050.DELAYCTRL_I2C_SLV3_DLY_EN_BIT = 3;
MPU6050.DELAYCTRL_I2C_SLV2_DLY_EN_BIT = 2;
MPU6050.DELAYCTRL_I2C_SLV1_DLY_EN_BIT = 1;
MPU6050.DELAYCTRL_I2C_SLV0_DLY_EN_BIT = 0;

/** Get external data shadow delay enabled status.
 * This register is used to specify the timing of external sensor data
 * shadowing. When DELAY_ES_SHADOW is set to 1, shadowing of external
 * sensor data is delayed until all data has been received.
 * @return Current external data shadow delay enabled status.
 * @see MPU6050.RA_I2C_MST_DELAY_CTRL
 * @see MPU6050.DELAYCTRL_DELAY_ES_SHADOW_BIT
 */
MPU6050.prototype.getExternalShadowDelayEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_DELAY_CTRL, MPU6050.DELAYCTRL_DELAY_ES_SHADOW_BIT, callback);
};
/** Set external data shadow delay enabled status.
 * @param enabled New external data shadow delay enabled status.
 * @see getExternalShadowDelayEnabled()
 * @see MPU6050.RA_I2C_MST_DELAY_CTRL
 * @see MPU6050.DELAYCTRL_DELAY_ES_SHADOW_BIT
 */
MPU6050.prototype.setExternalShadowDelayEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_MST_DELAY_CTRL, MPU6050.DELAYCTRL_DELAY_ES_SHADOW_BIT, enabled, callback);
};
/** Get slave delay enabled status.
 * When a particular slave delay is enabled, the rate of access for the that
 * slave device is reduced. When a slave's access rate is decreased relative to
 * the Sample Rate, the slave is accessed every:
 *
 *     1 / (1 + I2C_MST_DLY) Samples
 *
 * This base Sample Rate in turn is determined by SMPLRT_DIV (register  * 25)
 * and DLPF_CFG (register 26).
 *
 * For further information regarding I2C_MST_DLY, please refer to register 52.
 * For further information regarding the Sample Rate, please refer to register 25.
 *
 * @param num Slave number (0-4)
 * @return Current slave delay enabled status.
 * @see MPU6050.RA_I2C_MST_DELAY_CTRL
 * @see MPU6050.DELAYCTRL_I2C_SLV0_DLY_EN_BIT
 */
MPU6050.prototype.getSlaveDelayEnabled = function(num, callback) {
  // MPU6050.DELAYCTRL_I2C_SLV4_DLY_EN_BIT is 4, SLV3 is 3, etc.
  this.i2cdev.readBit(MPU6050.RA_I2C_MST_DELAY_CTRL, Math.abs(num%5), callback);
};
/** Set slave delay enabled status.
 * @param num Slave number (0-4)
 * @param enabled New slave delay enabled status.
 * @see MPU6050.RA_I2C_MST_DELAY_CTRL
 * @see MPU6050.DELAYCTRL_I2C_SLV0_DLY_EN_BIT
 */
MPU6050.prototype.setSlaveDelayEnabled = function(num, enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_I2C_MST_DELAY_CTRL, num, enabled, callback);
};

// SIGNAL_PATH_RESET register
MPU6050.RA_SIGNAL_PATH_RESET = 0x68;

MPU6050.PATHRESET_GYRO_RESET_BIT = 2;
MPU6050.PATHRESET_ACCEL_RESET_BIT = 1;
MPU6050.PATHRESET_TEMP_RESET_BIT = 0;

/** Reset gyroscope signal path.
 * The reset will revert the signal path analog to digital converters and
 * filters to their power up configurations.
 * @see MPU6050.RA_SIGNAL_PATH_RESET
 * @see MPU6050.PATHRESET_GYRO_RESET_BIT
 */
MPU6050.prototype.resetGyroscopePath = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_SIGNAL_PATH_RESET, MPU6050.PATHRESET_GYRO_RESET_BIT, true, callback);
};
/** Reset accelerometer signal path.
 * The reset will revert the signal path analog to digital converters and
 * filters to their power up configurations.
 * @see MPU6050.RA_SIGNAL_PATH_RESET
 * @see MPU6050.PATHRESET_ACCEL_RESET_BIT
 */
MPU6050.prototype.resetAccelerometerPath = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_SIGNAL_PATH_RESET, MPU6050.PATHRESET_ACCEL_RESET_BIT, true, callback);
};
/** Reset temperature sensor signal path.
 * The reset will revert the signal path analog to digital converters and
 * filters to their power up configurations.
 * @see MPU6050.RA_SIGNAL_PATH_RESET
 * @see MPU6050.PATHRESET_TEMP_RESET_BIT
 */
MPU6050.prototype.resetTemperaturePath = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_SIGNAL_PATH_RESET, MPU6050.PATHRESET_TEMP_RESET_BIT, true, callback);
};

// MOT_DETECT_CTRL register
MPU6050.RA_MOT_DETECT_CTRL = 0x69;

MPU6050.DETECT_ACCEL_ON_DELAY_BIT = 5;
MPU6050.DETECT_ACCEL_ON_DELAY_LENGTH = 2;
MPU6050.DETECT_FF_COUNT_BIT = 3;
MPU6050.DETECT_FF_COUNT_LENGTH = 2;
MPU6050.DETECT_MOT_COUNT_BIT = 1;
MPU6050.DETECT_MOT_COUNT_LENGTH = 2;

MPU6050.DETECT_DECREMENT_RESET = 0x0;
MPU6050.DETECT_DECREMENT_1 = 0x1;
MPU6050.DETECT_DECREMENT_2 = 0x2;
MPU6050.DETECT_DECREMENT_4 = 0x3;

/** Get accelerometer power-on delay.
 * The accelerometer data path provides samples to the sensor registers, Motion
 * detection, Zero Motion detection, and Free Fall detection modules. The
 * signal path contains filters which must be flushed on wake-up with new
 * samples before the detection modules begin operations. The default wake-up
 * delay, of 4ms can be lengthened by up to 3ms. This additional delay is
 * specified in ACCEL_ON_DELAY in units of 1 LSB = 1 ms. The user may select
 * any value above zero unless instructed otherwise by InvenSense. Please refer
 * to Section 8 of the MPU-6000/MPU-6050 Product Specification document for
 * further information regarding the detection modules.
 * @return Current accelerometer power-on delay
 * @see MPU6050.RA_MOT_DETECT_CTRL
 * @see MPU6050.DETECT_ACCEL_ON_DELAY_BIT
 */
MPU6050.prototype.getAccelerometerPowerOnDelay = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_MOT_DETECT_CTRL, MPU6050.DETECT_ACCEL_ON_DELAY_BIT, MPU6050.DETECT_ACCEL_ON_DELAY_LENGTH, callback);
};
/** Set accelerometer power-on delay.
 * @param delay New accelerometer power-on delay (0-3)
 * @see getAccelerometerPowerOnDelay()
 * @see MPU6050.RA_MOT_DETECT_CTRL
 * @see MPU6050.DETECT_ACCEL_ON_DELAY_BIT
 */
MPU6050.prototype.setAccelerometerPowerOnDelay = function(delay, callback) {
  this.i2cdev.writeBits(MPU6050.RA_MOT_DETECT_CTRL, MPU6050.DETECT_ACCEL_ON_DELAY_BIT, MPU6050.DETECT_ACCEL_ON_DELAY_LENGTH, delay, callback);
};
/** Get Free Fall detection counter decrement configuration.
 * Detection is registered by the Free Fall detection module after accelerometer
 * measurements meet their respective threshold conditions over a specified
 * number of samples. When the threshold conditions are met, the corresponding
 * detection counter increments by 1. The user may control the rate at which the
 * detection counter decrements when the threshold condition is not met by
 * configuring FF_COUNT. The decrement rate can be set according to the
 * following table:
 *
 * <pre>
 * FF_COUNT | Counter Decrement
 * ---------+------------------
 * 0        | Reset
 * 1        | 1
 * 2        | 2
 * 3        | 4
 * </pre>
 *
 * When FF_COUNT is configured to 0 (reset), any non-qualifying sample will
 * reset the counter to 0. For further information on Free Fall detection,
 * please refer to Registers 29 to 32.
 *
 * @return Current decrement configuration
 * @see MPU6050.RA_MOT_DETECT_CTRL
 * @see MPU6050.DETECT_FF_COUNT_BIT
 */
MPU6050.prototype.getFreefallDetectionCounterDecrement = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_MOT_DETECT_CTRL, MPU6050.DETECT_FF_COUNT_BIT, MPU6050.DETECT_FF_COUNT_LENGTH, callback);
};
/** Set Free Fall detection counter decrement configuration.
 * @param decrement New decrement configuration value
 * @see getFreefallDetectionCounterDecrement()
 * @see MPU6050.RA_MOT_DETECT_CTRL
 * @see MPU6050.DETECT_FF_COUNT_BIT
 */
MPU6050.prototype.setFreefallDetectionCounterDecrement = function(decrement, callback) {
  this.i2cdev.writeBits(MPU6050.RA_MOT_DETECT_CTRL, MPU6050.DETECT_FF_COUNT_BIT, MPU6050.DETECT_FF_COUNT_LENGTH, decrement, callback);
};
/** Get Motion detection counter decrement configuration.
 * Detection is registered by the Motion detection module after accelerometer
 * measurements meet their respective threshold conditions over a specified
 * number of samples. When the threshold conditions are met, the corresponding
 * detection counter increments by 1. The user may control the rate at which the
 * detection counter decrements when the threshold condition is not met by
 * configuring MOT_COUNT. The decrement rate can be set according to the
 * following table:
 *
 * <pre>
 * MOT_COUNT | Counter Decrement
 * ----------+------------------
 * 0         | Reset
 * 1         | 1
 * 2         | 2
 * 3         | 4
 * </pre>
 *
 * When MOT_COUNT is configured to 0 (reset), any non-qualifying sample will
 * reset the counter to 0. For further information on Motion detection,
 * please refer to Registers 29 to 32.
 *
 */
MPU6050.prototype.getMotionDetectionCounterDecrement = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_MOT_DETECT_CTRL, MPU6050.DETECT_MOT_COUNT_BIT, MPU6050.DETECT_MOT_COUNT_LENGTH, callback);
};
/** Set Motion detection counter decrement configuration.
 * @param decrement New decrement configuration value
 * @see getMotionDetectionCounterDecrement()
 * @see MPU6050.RA_MOT_DETECT_CTRL
 * @see MPU6050.DETECT_MOT_COUNT_BIT
 */
MPU6050.prototype.setMotionDetectionCounterDecrement = function(decrement, callback) {
  this.i2cdev.writeBits(MPU6050.RA_MOT_DETECT_CTRL, MPU6050.DETECT_MOT_COUNT_BIT, MPU6050.DETECT_MOT_COUNT_LENGTH, decrement, callback);
};

// USER_CTRL register

/** Get FIFO enabled status.
 * When this bit is set to 0, the FIFO buffer is disabled. The FIFO buffer
 * cannot be written to or read from while disabled. The FIFO buffer's state
 * does not change unless the MPU-60X0 is power cycled.
 * @return Current FIFO enabled status
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_FIFO_EN_BIT
 */
MPU6050.prototype.getFIFOEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_FIFO_EN_BIT, callback);
};
/** Set FIFO enabled status.
 * @param enabled New FIFO enabled status
 * @see getFIFOEnabled()
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_FIFO_EN_BIT
 */
MPU6050.prototype.setFIFOEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_FIFO_EN_BIT, enabled, callback);
};
/** Get I2C Master Mode enabled status.
 * When this mode is enabled, the MPU-60X0 acts as the I2C Master to the
 * external sensor slave devices on the auxiliary I2C bus. When this bit is
 * cleared to 0, the auxiliary I2C bus lines (AUX_DA and AUX_CL) are logically
 * driven by the primary I2C bus (SDA and SCL). This is a precondition to
 * enabling Bypass Mode. For further information regarding Bypass Mode, please
 * refer to Register 55.
 * @return Current I2C Master Mode enabled status
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_I2C_MST_EN_BIT
 */
MPU6050.prototype.getI2CMasterModeEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_I2C_MST_EN_BIT, callback);
};
/** Set I2C Master Mode enabled status.
 * @param enabled New I2C Master Mode enabled status
 * @see getI2CMasterModeEnabled()
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_I2C_MST_EN_BIT
 */
MPU6050.prototype.setI2CMasterModeEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_I2C_MST_EN_BIT, enabled, callback);
};
/** Switch from I2C to SPI mode (MPU-6000 only)
 * If this is set, the primary SPI interface will be enabled in place of the
 * disabled primary I2C interface.
 */
MPU6050.prototype.switchSPIEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_I2C_IF_DIS_BIT, enabled, callback);
}
/** Reset the FIFO.
 * This bit resets the FIFO buffer when set to 1 while FIFO_EN equals 0. This
 * bit automatically clears to 0 after the reset has been triggered.
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_FIFO_RESET_BIT
 */
MPU6050.prototype.resetFIFO = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_FIFO_RESET_BIT, true, callback);
};
/** Reset the I2C Master.
 * This bit resets the I2C Master when set to 1 while I2C_MST_EN equals 0.
 * This bit automatically clears to 0 after the reset has been triggered.
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_I2C_MST_RESET_BIT
 */
MPU6050.prototype.resetI2CMaster = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_I2C_MST_RESET_BIT, true, callback);
};
/** Reset all sensor registers and signal paths.
 * When set to 1, this bit resets the signal paths for all sensors (gyroscopes,
 * accelerometers, and temperature sensor). This operation will also clear the
 * sensor registers. This bit automatically clears to 0 after the reset has been
 * triggered.
 *
 * When resetting only the signal path (and not the sensor registers), please
 * use Register 104, SIGNAL_PATH_RESET.
 *
 * @see MPU6050.RA_USER_CTRL
 * @see MPU6050.USERCTRL_SIG_COND_RESET_BIT
 */
MPU6050.prototype.resetSensors = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_SIG_COND_RESET_BIT, true, callback);
};

// PWR_MGMT_1 register

/** Trigger a full device reset.
 * A small delay of ~50ms may be desirable after triggering a reset.
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_DEVICE_RESET_BIT
 */
MPU6050.prototype.reset = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_DEVICE_RESET_BIT, true, callback);
};
/** Get sleep mode status.
 * Setting the SLEEP bit in the register puts the device into very low power
 * sleep mode. In this mode, only the serial interface and internal registers
 * remain active, allowing for a very low standby current. Clearing this bit
 * puts the device back into normal mode. To save power, the individual standby
 * selections for each of the gyros should be used if any gyro axis is not used
 * by the application.
 * @return Current sleep mode enabled status
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_SLEEP_BIT
 */
MPU6050.prototype.getSleepEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_SLEEP_BIT, callback);
};
/** Set sleep mode status.
 * @param enabled New sleep mode enabled status
 * @see getSleepEnabled()
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_SLEEP_BIT
 */
MPU6050.prototype.setSleepEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_SLEEP_BIT, enabled, callback);
};
/** Get wake cycle enabled status.
 * When this bit is set to 1 and SLEEP is disabled, the MPU-60X0 will cycle
 * between sleep mode and waking up to take a single sample of data from active
 * sensors at a rate determined by LP_WAKE_CTRL (register 108).
 * @return Current sleep mode enabled status
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_CYCLE_BIT
 */
MPU6050.prototype.getWakeCycleEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_CYCLE_BIT, callback);
};
/** Set wake cycle enabled status.
 * @param enabled New sleep mode enabled status
 * @see getWakeCycleEnabled()
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_CYCLE_BIT
 */
MPU6050.prototype.setWakeCycleEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_CYCLE_BIT, enabled, callback);
};
/** Get temperature sensor enabled status.
 * Control the usage of the internal temperature sensor.
 *
 * Note: this register stores the *disabled* value, but for consistency with the
 * rest of the code, the function is named and used with standard true/false
 * values to indicate whether the sensor is enabled or disabled, respectively.
 *
 * @return Current temperature sensor enabled status
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_TEMP_DIS_BIT
 */
MPU6050.prototype.getTempSensorEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_TEMP_DIS_BIT, callback);
//  return buffer[0] == 0; // 1 is actually disabled here
};
/** Set temperature sensor enabled status.
 * Note: this register stores the *disabled* value, but for consistency with the
 * rest of the code, the function is named and used with standard true/false
 * values to indicate whether the sensor is enabled or disabled, respectively.
 *
 * @param enabled New temperature sensor enabled status
 * @see getTempSensorEnabled()
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_TEMP_DIS_BIT
 */
MPU6050.prototype.setTempSensorEnabled = function(enabled, callback) {
  // 1 is actually disabled here
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_TEMP_DIS_BIT, !enabled, callback);
};

MPU6050.RA_PWR_MGMT_1 = 0x6B;

MPU6050.PWR1_DEVICE_RESET_BIT = 7;
MPU6050.PWR1_SLEEP_BIT = 6;
MPU6050.PWR1_CYCLE_BIT = 5;
MPU6050.PWR1_TEMP_DIS_BIT = 3;
MPU6050.PWR1_CLKSEL_BIT = 2;
MPU6050.PWR1_CLKSEL_LENGTH = 3;

/** Get clock source setting.
 * @return Current clock source setting
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_CLKSEL_BIT
 * @see MPU6050.PWR1_CLKSEL_LENGTH
 */
MPU6050.prototype.getClockSource = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_CLKSEL_BIT, MPU6050.PWR1_CLKSEL_LENGTH, callback);
};
/** Set clock source setting.
 * An internal 8MHz oscillator, gyroscope based clock, or external sources can
 * be selected as the MPU-60X0 clock source. When the internal 8 MHz oscillator
 * or an external source is chosen as the clock source, the MPU-60X0 can operate
 * in low power modes with the gyroscopes disabled.
 *
 * Upon power up, the MPU-60X0 clock source defaults to the internal oscillator.
 * However, it is highly recommended that the device be configured to use one of
 * the gyroscopes (or an external clock source) as the clock reference for
 * improved stability. The clock source can be selected according to the following table:
 *
 * <pre>
 * CLK_SEL | Clock Source
 * --------+--------------------------------------
 * 0       | Internal oscillator
 * 1       | PLL with X Gyro reference
 * 2       | PLL with Y Gyro reference
 * 3       | PLL with Z Gyro reference
 * 4       | PLL with external 32.768kHz reference
 * 5       | PLL with external 19.2MHz reference
 * 6       | Reserved
 * 7       | Stops the clock and keeps the timing generator in reset
 * </pre>
 *
 * @param source New clock source setting
 * @see getClockSource()
 * @see MPU6050.RA_PWR_MGMT_1
 * @see MPU6050.PWR1_CLKSEL_BIT
 * @see MPU6050.PWR1_CLKSEL_LENGTH
 */
MPU6050.prototype.setClockSource = function(source, callback) {
  this.i2cdev.writeBits(MPU6050.RA_PWR_MGMT_1, MPU6050.PWR1_CLKSEL_BIT, MPU6050.PWR1_CLKSEL_LENGTH, source, callback);
};

// PWR_MGMT_2 register
MPU6050.RA_PWR_MGMT_2 = 0x6C;

MPU6050.PWR2_LP_WAKE_CTRL_BIT = 7;
MPU6050.PWR2_LP_WAKE_CTRL_LENGTH = 2;
MPU6050.PWR2_STBY_XA_BIT = 5;
MPU6050.PWR2_STBY_YA_BIT = 4;
MPU6050.PWR2_STBY_ZA_BIT = 3;
MPU6050.PWR2_STBY_XG_BIT = 2;
MPU6050.PWR2_STBY_YG_BIT = 1;
MPU6050.PWR2_STBY_ZG_BIT = 0;

/** Get wake frequency in Accel-Only Low Power Mode.
 * The MPU-60X0 can be put into Accerlerometer Only Low Power Mode by setting
 * PWRSEL to 1 in the Power Management 1 register (Register 107). In this mode,
 * the device will power off all devices except for the primary I2C interface,
 * waking only the accelerometer at fixed intervals to take a single
 * measurement. The frequency of wake-ups can be configured with LP_WAKE_CTRL
 * as shown below:
 *
 * <pre>
 * LP_WAKE_CTRL | Wake-up Frequency
 * -------------+------------------
 * 0            | 1.25 Hz
 * 1            | 2.5 Hz
 * 2            | 5 Hz
 * 3            | 10 Hz
 * <pre>
 *
 * For further information regarding the MPU-60X0's power modes, please refer to
 * Register 107.
 *
 * @return Current wake frequency
 * @see MPU6050.RA_PWR_MGMT_2
 */
MPU6050.prototype.getWakeFrequency = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_LP_WAKE_CTRL_BIT, MPU6050.PWR2_LP_WAKE_CTRL_LENGTH, callback);
};
/** Set wake frequency in Accel-Only Low Power Mode.
 * @param frequency New wake frequency
 * @see MPU6050.RA_PWR_MGMT_2
 */
MPU6050.prototype.setWakeFrequency = function(frequency, callback) {
  this.i2cdev.writeBits(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_LP_WAKE_CTRL_BIT, MPU6050.PWR2_LP_WAKE_CTRL_LENGTH, frequency, callback);
};

/** Get X-axis accelerometer standby enabled status.
 * If enabled, the X-axis will not gather or report data (or use power).
 * @return Current X-axis standby enabled status
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_XA_BIT
 */
MPU6050.prototype.getStandbyXAccelEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_XA_BIT, callback);
};
/** Set X-axis accelerometer standby enabled status.
 * @param New X-axis standby enabled status
 * @see getStandbyXAccelEnabled()
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_XA_BIT
 */
MPU6050.prototype.setStandbyXAccelEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_XA_BIT, enabled, callback);
};
/** Get Y-axis accelerometer standby enabled status.
 * If enabled, the Y-axis will not gather or report data (or use power).
 * @return Current Y-axis standby enabled status
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_YA_BIT
 */
MPU6050.prototype.getStandbyYAccelEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_YA_BIT, callback);
};
/** Set Y-axis accelerometer standby enabled status.
 * @param New Y-axis standby enabled status
 * @see getStandbyYAccelEnabled()
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_YA_BIT
 */
MPU6050.prototype.setStandbyYAccelEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_YA_BIT, enabled, callback);
};
/** Get Z-axis accelerometer standby enabled status.
 * If enabled, the Z-axis will not gather or report data (or use power).
 * @return Current Z-axis standby enabled status
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_ZA_BIT
 */
MPU6050.prototype.getStandbyZAccelEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_ZA_BIT, callback);
};
/** Set Z-axis accelerometer standby enabled status.
 * @param New Z-axis standby enabled status
 * @see getStandbyZAccelEnabled()
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_ZA_BIT
 */
MPU6050.prototype.setStandbyZAccelEnabled = function(enabled) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_ZA_BIT, enabled);
};
/** Get X-axis gyroscope standby enabled status.
 * If enabled, the X-axis will not gather or report data (or use power).
 * @return Current X-axis standby enabled status
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_XG_BIT
 */
MPU6050.prototype.getStandbyXGyroEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_XG_BIT, callback);
};
/** Set X-axis gyroscope standby enabled status.
 * @param New X-axis standby enabled status
 * @see getStandbyXGyroEnabled()
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_XG_BIT
 */
MPU6050.prototype.setStandbyXGyroEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_XG_BIT, enabled, callback);
};
/** Get Y-axis gyroscope standby enabled status.
 * If enabled, the Y-axis will not gather or report data (or use power).
 * @return Current Y-axis standby enabled status
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_YG_BIT
 */
MPU6050.prototype.getStandbyYGyroEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_YG_BIT, callback);
};
/** Set Y-axis gyroscope standby enabled status.
 * @param New Y-axis standby enabled status
 * @see getStandbyYGyroEnabled()
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_YG_BIT
 */
MPU6050.prototype.setStandbyYGyroEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_YG_BIT, enabled, callback);
};
/** Get Z-axis gyroscope standby enabled status.
 * If enabled, the Z-axis will not gather or report data (or use power).
 * @return Current Z-axis standby enabled status
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_ZG_BIT
 */
MPU6050.prototype.getStandbyZGyroEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_ZG_BIT, callback);
};
/** Set Z-axis gyroscope standby enabled status.
 * @param New Z-axis standby enabled status
 * @see getStandbyZGyroEnabled()
 * @see MPU6050.RA_PWR_MGMT_2
 * @see MPU6050.PWR2_STBY_ZG_BIT
 */
MPU6050.prototype.setStandbyZGyroEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_PWR_MGMT_2, MPU6050.PWR2_STBY_ZG_BIT, enabled, callback);
};

// FIFO_COUNT* registers

/** Get current FIFO buffer size.
 * This value indicates the number of bytes stored in the FIFO buffer. This
 * number is in turn the number of bytes that can be read from the FIFO buffer
 * and it is directly proportional to the number of samples available given the
 * set of sensor data bound to be stored in the FIFO (register 35 and 36).
 * @return Current FIFO buffer size
 */

MPU6050.RA_FIFO_COUNTH = 0x72;
MPU6050.RA_FIFO_COUNTL = 0x73;

MPU6050.prototype.getFIFOCount = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_FIFO_COUNTH, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};

// FIFO_R_W register

/** Get byte from FIFO buffer.
 * This register is used to read and write data from the FIFO buffer. Data is
 * written to the FIFO in order of register number (from lowest to highest). If
 * all the FIFO enable flags (see below) are enabled and all External Sensor
 * Data registers (Registers 73 to 96) are associated with a Slave device, the
 * contents of registers 59 through 96 will be written in order at the Sample
 * Rate.
 *
 * The contents of the sensor data registers (Registers 59 to 96) are written
 * into the FIFO buffer when their corresponding FIFO enable flags are set to 1
 * in FIFO_EN (Register 35). An additional flag for the sensor data registers
 * associated with I2C Slave 3 can be found in I2C_MST_CTRL (Register 36).
 *
 * If the FIFO buffer has overflowed, the status bit FIFO_OFLOW_INT is
 * automatically set to 1. This bit is located in INT_STATUS (Register 58).
 * When the FIFO buffer has overflowed, the oldest data will be lost and new
 * data will be written to the FIFO.
 *
 * If the FIFO buffer is empty, reading this register will return the last byte
 * that was previously read from the FIFO until new data is available. The user
 * should check FIFO_COUNT to ensure that the FIFO buffer is not read when
 * empty.
 *
 * @return Byte from FIFO buffer
 */
MPU6050.RA_FIFO_R_W = 0x74;

MPU6050.prototype.getFIFOByte = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_FIFO_R_W, callback);

};
MPU6050.prototype.getFIFOBytes = function(data, length, callback) {
  this.i2cdev.readBytes(MPU6050.RA_FIFO_R_W, length, function(err, buffer) {
    //UNTESTED - encoding might be [ascii, utf8, utf16le, ucs2, base64, binary, hex]
    callback(err, buffer.toString('ascii', 0, length));
  });
};
/** Write byte to FIFO buffer.
 * @see getFIFOByte()
 * @see MPU6050.RA_FIFO_R_W
 */
MPU6050.prototype.setFIFOByte = function(data, callback) {
  this.i2cdev.writeByte(MPU6050.RA_FIFO_R_W, data, callback);
};

// WHO_AM_I register
MPU6050.RA_WHO_AM_I = 0x75;
MPU6050.WHO_AM_I_BIT = 6;
MPU6050.WHO_AM_I_LENGTH = 6;

/** Get Device ID.
 * This register is used to verify the identity of the device (0b110100, 0x34).
 * @return Device ID (6 bits only! should be 0x34)
 * @see MPU6050.RA_WHO_AM_I
 * @see MPU6050.WHO_AM_I_BIT
 * @see MPU6050.WHO_AM_I_LENGTH
 */
MPU6050.prototype.getDeviceID = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_WHO_AM_I, MPU6050.WHO_AM_I_BIT, MPU6050.WHO_AM_I_LENGTH, callback);
};
/** Set Device ID.
 * Write a new ID into the WHO_AM_I register (no idea why this should ever be
 * necessary though).
 * @param id New device ID to set.
 * @see getDeviceID()
 * @see MPU6050.RA_WHO_AM_I
 * @see MPU6050.WHO_AM_I_BIT
 * @see MPU6050.WHO_AM_I_LENGTH
 */
MPU6050.prototype.setDeviceID = function(id, callback) {
  this.i2cdev.writeBits(MPU6050.RA_WHO_AM_I, MPU6050.WHO_AM_I_BIT, MPU6050.WHO_AM_I_LENGTH, id, callback);
};

// ======== UNDOCUMENTED/DMP REGISTERS/METHODS ========

// XG_OFFS_TC register

MPU6050.prototype.getOTPBankValid = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_XG_OFFS_TC, MPU6050.TC_OTP_BNK_VLD_BIT, callback);
};
MPU6050.prototype.setOTPBankValid = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_XG_OFFS_TC, MPU6050.TC_OTP_BNK_VLD_BIT, enabled, callback);
};
MPU6050.prototype.getXGyroOffsetTC = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_XG_OFFS_TC, MPU6050.TC_OFFSET_BIT, MPU6050.TC_OFFSET_LENGTH, callback);
};
MPU6050.prototype.setXGyroOffsetTC = function(offset, callback) {
  this.i2cdev.writeBits(MPU6050.RA_XG_OFFS_TC, MPU6050.TC_OFFSET_BIT, MPU6050.TC_OFFSET_LENGTH, offset, callback);
};

// YG_OFFS_TC register

MPU6050.prototype.getYGyroOffsetTC = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_YG_OFFS_TC, MPU6050.TC_OFFSET_BIT, MPU6050.TC_OFFSET_LENGTH, callback);
};
MPU6050.prototype.setYGyroOffsetTC = function(offset, callback) {
  this.i2cdev.writeBits(MPU6050.RA_YG_OFFS_TC, MPU6050.TC_OFFSET_BIT, MPU6050.TC_OFFSET_LENGTH, offset, callback);
};

// ZG_OFFS_TC register

MPU6050.prototype.getZGyroOffsetTC = function(callback) {
  this.i2cdev.readBits(MPU6050.RA_ZG_OFFS_TC, MPU6050.TC_OFFSET_BIT, MPU6050.TC_OFFSET_LENGTH, callback);
};
MPU6050.prototype.setZGyroOffsetTC = function(offset, callback) {
  this.i2cdev.writeBits(MPU6050.RA_ZG_OFFS_TC, MPU6050.TC_OFFSET_BIT, MPU6050.TC_OFFSET_LENGTH, offset, callback);
};

// X_FINE_GAIN register
MPU6050.RA_X_FINE_GAIN = 0x03;

MPU6050.prototype.getXFineGain = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_X_FINE_GAIN, callback);
};
MPU6050.prototype.setXFineGain = function(gain, callback) {
  this.i2cdev.writeByte(MPU6050.RA_X_FINE_GAIN, gain, callback);
};

// Y_FINE_GAIN register

MPU6050.RA_Y_FINE_GAIN = 0x04;

MPU6050.prototype.getYFineGain = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_Y_FINE_GAIN, callback);
};
MPU6050.prototype.setYFineGain = function(gain, callback) {
  this.i2cdev.writeByte(MPU6050.RA_Y_FINE_GAIN, gain, callback);
};

// Z_FINE_GAIN register

MPU6050.RA_Z_FINE_GAIN = 0x05;

MPU6050.prototype.getZFineGain = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_Z_FINE_GAIN, callback);
};
MPU6050.prototype.setZFineGain = function(gain, callback) {
  this.i2cdev.writeByte(MPU6050.RA_Z_FINE_GAIN, gain, callback);
};

// XA_OFFS_* registers
MPU6050.RA_XA_OFFS_H = 0x06;

MPU6050.prototype.getXAccelOffset = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_XA_OFFS_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
MPU6050.prototype.setXAccelOffset = function(offset, callback) {
  var buffer = new Buffer(2);
  buffer.writeInt16BE(offset);
  this.i2cdev.writeBytes(MPU6050.RA_XA_OFFS_H, buffer, callback);
};

// YA_OFFS_* register
MPU6050.RA_YA_OFFS_H = 0x08;

MPU6050.prototype.getYAccelOffset = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_YA_OFFS_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
MPU6050.prototype.setYAccelOffset = function(offset, callback) {
  var buffer = new Buffer(2);
  buffer.writeInt16BE(offset);
  this.i2cdev.writeBytes(MPU6050.RA_YA_OFFS_H, buffer, callback);
};

// ZA_OFFS_* register
MPU6050.RA_ZA_OFFS_H = 0x0A;

MPU6050.prototype.getZAccelOffset = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ZA_OFFS_H, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
MPU6050.prototype.setZAccelOffset = function(offset, callback) {
  var buffer = new Buffer(2);
  buffer.writeInt16BE(offset);
  this.i2cdev.writeBytes(MPU6050.RA_ZA_OFFS_H, buffer, callback);
};

// XG_OFFS_USR* registers
MPU6050.RA_XG_OFFS_USRH = 0x13;

MPU6050.prototype.getXGyroOffset = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_XG_OFFS_USRH, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
MPU6050.prototype.setXGyroOffset = function(offset, callback) {
  var buffer = new Buffer(2);
  buffer.writeInt16BE(offset);
  this.i2cdev.writeBytes(MPU6050.RA_XG_OFFS_USRH, buffer, callback);
};

// YG_OFFS_USR* register
MPU6050.RA_YG_OFFS_USRH = 0x15;

MPU6050.prototype.getYGyroOffset = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_YG_OFFS_USRH, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
MPU6050.prototype.setYGyroOffset = function(offset, callback) {
  var buffer = new Buffer(2);
  buffer.writeInt16BE(offset);
  this.i2cdev.writeBytes(MPU6050.RA_YG_OFFS_USRH, buffer, callback);
};

// ZG_OFFS_USR* register
MPU6050.RA_ZG_OFFS_USRH = 0x17;

MPU6050.prototype.getZGyroOffset = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ZG_OFFS_USRH, 2, function(err, buffer) {
    callback(err, buffer.readInt16BE(0));
  });
};
MPU6050.prototype.setZGyroOffset = function(offset, callback) {
  var buffer = new Buffer(2);
  buffer.writeInt16BE(offset);
  this.i2cdev.writeBytes(MPU6050.RA_ZG_OFFS_USRH, buffer, callback);
};

// INT_ENABLE register (DMP functions)
MPU6050.RA_INT_ENABLE = 0x38;

MPU6050.INTERRUPT_FF_BIT = 7;
MPU6050.INTERRUPT_MOT_BIT = 6;
MPU6050.INTERRUPT_ZMOT_BIT = 5;
MPU6050.INTERRUPT_FIFO_OFLOW_BIT = 4;
MPU6050.INTERRUPT_I2C_MST_INT_BIT = 3;
MPU6050.INTERRUPT_PLL_RDY_INT_BIT = 2;
MPU6050.INTERRUPT_DMP_INT_BIT = 1;
MPU6050.INTERRUPT_DATA_RDY_BIT = 0;

MPU6050.prototype.getIntPLLReadyEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_PLL_RDY_INT_BIT, callback);
};
MPU6050.prototype.setIntPLLReadyEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_PLL_RDY_INT_BIT, enabled, callback);
};
MPU6050.prototype.getIntDMPEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_DMP_INT_BIT, callback);
};
MPU6050.prototype.setIntDMPEnabled = function(enabled, callback) {
  this.i2cdev.writeBit(MPU6050.RA_INT_ENABLE, MPU6050.INTERRUPT_DMP_INT_BIT, enabled, callback);
};

// DMP_INT_STATUS
MPU6050.RA_DMP_INT_STATUS = 0x39;

MPU6050.DMPINT_5_BIT = 5;
MPU6050.DMPINT_4_BIT = 4;
MPU6050.DMPINT_3_BIT = 3;
MPU6050.DMPINT_2_BIT = 2;
MPU6050.DMPINT_1_BIT = 1;
MPU6050.DMPINT_0_BIT = 0;

MPU6050.prototype.getDMPInt5Status = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_DMP_INT_STATUS, MPU6050.DMPINT_5_BIT, callback);
};
MPU6050.prototype.getDMPInt4Status = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_DMP_INT_STATUS, MPU6050.DMPINT_4_BIT, callback);
};
MPU6050.prototype.getDMPInt3Status = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_DMP_INT_STATUS, MPU6050.DMPINT_3_BIT, callback);
};
MPU6050.prototype.getDMPInt2Status = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_DMP_INT_STATUS, MPU6050.DMPINT_2_BIT, callback);
};
MPU6050.prototype.getDMPInt1Status = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_DMP_INT_STATUS, MPU6050.DMPINT_1_BIT, callback);
};
MPU6050.prototype.getDMPInt0Status = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_DMP_INT_STATUS, MPU6050.DMPINT_0_BIT, callback);
};

// INT_STATUS register (DMP functions)
MPU6050.RA_INT_STATUS = 0x3A;

MPU6050.prototype.getIntPLLReadyStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_PLL_RDY_INT_BIT, callback);
};
MPU6050.prototype.getIntDMPStatus = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_INT_STATUS, MPU6050.INTERRUPT_DMP_INT_BIT, callback);
};

// USER_CTRL register (DMP functions)
MPU6050.RA_USER_CTRL = 0x6A;

MPU6050.USERCTRL_DMP_EN_BIT = 7;
MPU6050.USERCTRL_FIFO_EN_BIT = 6;
MPU6050.USERCTRL_I2C_MST_EN_BIT = 5;
MPU6050.USERCTRL_I2C_IF_DIS_BIT = 4;
MPU6050.USERCTRL_DMP_RESET_BIT = 3;
MPU6050.USERCTRL_FIFO_RESET_BIT = 2;
MPU6050.USERCTRL_I2C_MST_RESET_BIT = 1;
MPU6050.USERCTRL_SIG_COND_RESET_BIT = 0;

MPU6050.prototype.getDMPEnabled = function(callback) {
  this.i2cdev.readBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_DMP_EN_BIT, callback);
};
MPU6050.prototype.setDMPEnabled = function(enabled) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_DMP_EN_BIT, enabled);
};
MPU6050.prototype.resetDMP = function(callback) {
  this.i2cdev.writeBit(MPU6050.RA_USER_CTRL, MPU6050.USERCTRL_DMP_RESET_BIT, true, callback);
};

// BANK_SEL register
MPU6050.RA_BANK_SEL = 0x6D;

MPU6050.prototype.setMemoryBank = function(bank, prefetchEnabled, userBank, callback) {
  bank &= 0x1F;
  if (userBank) bank |= 0x20;
  if (prefetchEnabled) bank |= 0x40;
  this.i2cdev.writeByte(MPU6050.RA_BANK_SEL, bank, callback);
};

// MEM_START_ADDR register
MPU6050.RA_MEM_START_ADDR = 0x6E;

MPU6050.prototype.setMemoryStartAddress = function(address, callback) {
  this.i2cdev.writeByte(MPU6050.RA_MEM_START_ADDR, address, callback);
};

// MEM_R_W register
/** MEMORY READING AND WRITING

MPU6050.prototype.readMemoryByte = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_MEM_R_W, callback);
};
MPU6050.prototype.writeMemoryByte = function(data) {
  this.i2cdev.writeByte(MPU6050.RA_MEM_R_W, data);
};
MPU6050.prototype.readMemoryBlock = function(*data, dataSize, bank, address) {
  setMemoryBank(bank);
  setMemoryStartAddress(address);
  chunkSize;
  for (i = 0; i < dataSize;) {
    // determine correct chunk size according to bank position and data size
    chunkSize = MPU6050.DMP_MEMORY_CHUNK_SIZE;

    // make sure we don't go past the data size
    if (i + chunkSize > dataSize) chunkSize = dataSize - i;

    // make sure this chunk doesn't go past the bank boundary (256 bytes)
    if (chunkSize > 256 - address) chunkSize = 256 - address;

    // read the chunk of data as specified
    this.i2cdev.readBytes(MPU6050.RA_MEM_R_W, chunkSize, data + i);

    // increase byte index by [chunkSize]
    i += chunkSize;

    // automatically wraps to 0 at 256
    address += chunkSize;

    // if we aren't done, update bank (if necessary) and address
    if (i < dataSize) {
      if (address == 0) bank++;
      setMemoryBank(bank);
      setMemoryStartAddress(address);
    }
  }
}
MPU6050.prototype.writeMemoryBlock = function(const *data, dataSize, bank, address, verify, useProgMem) {
  setMemoryBank(bank);
  setMemoryStartAddress(address);
  chunkSize;
  *verifyBuffer;
  *progBuffer;
  i;
  j;
  if (verify) verifyBuffer = (*)malloc(MPU6050.DMP_MEMORY_CHUNK_SIZE);
  if (useProgMem) progBuffer = (*)malloc(MPU6050.DMP_MEMORY_CHUNK_SIZE);
  for (i = 0; i < dataSize;) {
    // determine correct chunk size according to bank position and data size
    chunkSize = MPU6050.DMP_MEMORY_CHUNK_SIZE;

    // make sure we don't go past the data size
    if (i + chunkSize > dataSize) chunkSize = dataSize - i;

    // make sure this chunk doesn't go past the bank boundary (256 bytes)
    if (chunkSize > 256 - address) chunkSize = 256 - address;

    if (useProgMem) {
      // write the chunk of data as specified
      for (j = 0; j < chunkSize; j++) progBuffer[j] = pgm_read_byte(data + i + j);
    } else {
      // write the chunk of data as specified
      progBuffer = (*)data + i;
    }

    this.i2cdev.writeBytes(MPU6050.RA_MEM_R_W, chunkSize, progBuffer);

    // verify data if needed
    if (verify && verifyBuffer) {
      setMemoryBank(bank);
      setMemoryStartAddress(address);
      this.i2cdev.readBytes(MPU6050.RA_MEM_R_W, chunkSize, verifyBuffer);
      if (memcmp(progBuffer, verifyBuffer, chunkSize) != 0) {
        /*Serial.print("Block write verification error, bank ");
         Serial.print(bank, DEC);
         Serial.print(", address ");
         Serial.print(address, DEC);
         Serial.print("!\nExpected:");
         for (j = 0; j < chunkSize; j++) {
         Serial.print(" 0x");
         if (progBuffer[j] < 16) Serial.print("0");
         Serial.print(progBuffer[j], HEX);
         }
         Serial.print("\nReceived:");
         for (j = 0; j < chunkSize; j++) {
         Serial.print(" 0x");
         if (verifyBuffer[i + j] < 16) Serial.print("0");
         Serial.print(verifyBuffer[i + j], HEX);
         }
         Serial.print("\n");* /
        free(verifyBuffer);
        if (useProgMem) free(progBuffer);
        return false; // uh oh.
      }
    }

    // increase byte index by [chunkSize]
    i += chunkSize;

    // automatically wraps to 0 at 256
    address += chunkSize;

    // if we aren't done, update bank (if necessary) and address
    if (i < dataSize) {
      if (address == 0) bank++;
      setMemoryBank(bank);
      setMemoryStartAddress(address);
    }
  }
  if (verify) free(verifyBuffer);
  if (useProgMem) free(progBuffer);
  return true;
}
MPU6050.prototype.writeProgMemoryBlock = function(data, dataSize, bank, address, verify) {
  return writeMemoryBlock(data, dataSize, bank, address, verify, true);
}
MPU6050.prototype.writeDMPConfigurationSet = function(data, dataSize, useProgMem) {
  *progBuffer, success, special;
  i, j;
  if (useProgMem) {
    progBuffer = (*)malloc(8); // assume 8-byte blocks, realloc later if necessary
  }

  // config set data is a long string of blocks with the following structure:
  // [bank] [offset] [length] [byte[0], byte[1], ..., byte[length]]
  bank, offset, length;
  for (i = 0; i < dataSize;) {
    if (useProgMem) {
      bank = pgm_read_byte(data + i++);
      offset = pgm_read_byte(data + i++);
      length = pgm_read_byte(data + i++);
    } else {
      bank = data[i++];
      offset = data[i++];
      length = data[i++];
    }

    // write data or perform special action
    if (length > 0) {
      // regular block of data to write
      /*Serial.print("Writing config block to bank ");
       Serial.print(bank);
       Serial.print(", offset ");
       Serial.print(offset);
       Serial.print(", length=");
       Serial.println(length);* /
      if (useProgMem) {
        if (sizeof(progBuffer) < length) progBuffer = (*)realloc(progBuffer, length);
        for (j = 0; j < length; j++) progBuffer[j] = pgm_read_byte(data + i + j);
      } else {
        progBuffer = (*)data + i;
      }
      success = writeMemoryBlock(progBuffer, length, bank, offset, true);
      i += length;
    } else {
      // special instruction
      // NOTE: this kind of behavior (what and when to do certain things)
      // is totally undocumented. This code is in here based on observed
      // behavior only, and exactly why (or even whether) it has to be here
      // is anybody's guess for now.
      if (useProgMem) {
        special = pgm_read_byte(data + i++);
      } else {
        special = data[i++];
      }
      /*Serial.print("Special command code ");
       Serial.print(special, HEX);
       Serial.println(" found...");* /
      if (special == 0x01) {
        // enable DMP-related interrupts

        //setIntZeroMotionEnabled(true);
        //setIntFIFOBufferOverflowEnabled(true);
        //setIntDMPEnabled(true);
        this.i2cdev.writeByte(MPU6050.RA_INT_ENABLE, 0x32);  // single operation

        success = true;
      } else {
        // unknown special command
        success = false;
      }
    }

    if (!success) {
      if (useProgMem) free(progBuffer);
      return false; // uh oh
    }
  }
  if (useProgMem) free(progBuffer);
  return true;
};
MPU6050.prototype.writeProgDMPConfigurationSet = function(data, dataSize) {
  return writeDMPConfigurationSet(data, dataSize, true);
};
*/

// DMP_CFG_1 register
MPU6050.RA_DMP_CFG_1 = 0x70;

MPU6050.prototype.getDMPConfig1 = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_DMP_CFG_1, callback);
};
MPU6050.prototype.setDMPConfig1 = function(config, callback) {
  this.i2cdev.writeByte(MPU6050.RA_DMP_CFG_1, config, callback);
};

// DMP_CFG_2 register
MPU6050.RA_DMP_CFG_2 = 0x71;

MPU6050.prototype.getDMPConfig2 = function(callback) {
  this.i2cdev.readByte(MPU6050.RA_DMP_CFG_2, callback);
};
MPU6050.prototype.setDMPConfig2 = function(config, callback) {
  this.i2cdev.writeByte(MPU6050.RA_DMP_CFG_2, config, callback);
};





































MPU6050.RA_GYRO_XOUT_H = 0x43;
MPU6050.RA_GYRO_XOUT_L = 0x44;
MPU6050.RA_GYRO_YOUT_H = 0x45;
MPU6050.RA_GYRO_YOUT_L = 0x46;
MPU6050.RA_GYRO_ZOUT_H = 0x47;
MPU6050.RA_GYRO_ZOUT_L = 0x48;


//==============================================================================
//==============================================================================
//==============================================================================


/**
 * Power on and prepare for general usage.
 * This will activate the device and take it out of sleep mode (which must be done
 * after start-up). This function also sets both the accelerometer and the gyroscope
 * to their most sensitive settings, namely +/- 2g and +/- 250 degrees/sec, and sets
 * the clock source to use the X Gyro for reference, which is slightly better than
 * the default internal clock source.
 */
MPU6050.prototype.initialize = function(callback) {
  this.i2cdev = new I2cDev(this.address, {
    device: this.device
  });

  var init = new Group(this, callback);
  //TODO: Should the accelerometer mode be used for the clock source and the Accel Range?
  this.setClockSource(MPU6050.CLOCK_PLL_XGYRO, init.addCallback('MPU6050: Clock Source Set -> ' + this.accelerometer.mode));
  this.setFullScaleGyroRange(this.gyroscope.range, init.addCallback('MPU6050: Full Scale Gyro Range Set -> ' + this.gyroscope.mode));
  this.setFullScaleAccelRange(this.accelerometer.range, init.addCallback('MPU6050: Full Scale Accel Range Set -> ' + this.accelerometer.mode));
  this.setSleepEnabled(false, init.addCallback('MPU6050: Sleep Enabled Set -> false'));
};

/**
 * Verify the I2C connection.
 * Make sure the device is connected and responds as expected.
 * @return True if connection is valid, false otherwise
 */
MPU6050.prototype.testConnection = function(callback) {
  this.getDeviceID(function(err, id) {
    callback(err, id === 0x34);
  });
};

/**
 * Verify the I2C connection and all default settings.
 * @param callback
 */
MPU6050.prototype.testAllDeviceFunctionality = function(callback) {
  var group = new Group(this, callback);
  this.getDeviceID(group.addCallback(pad('MPU6050: DEVICE ID', 54) + ':  '));
  this.getAuxVDDIOLevel(group.addCallback(pad('MPU6050: AUXILIARY VDD IO LEVEL', 54) + ':  '));
  this.getOTPBankValid(group.addCallback(pad('MPU6050: UNDEFINED -- OTP BANK VALID', 54) + ':  '));
  this.getXGyroOffsetTC(group.addCallback(pad('MPU6050: UNDEFINED -- XGYRO OFFSET TC', 54) + ':  '));
  this.getYGyroOffsetTC(group.addCallback(pad('MPU6050: UNDEFINED -- YGYRO OFFSET TC', 54) + ':  '));
  this.getZGyroOffsetTC(group.addCallback(pad('MPU6050: UNDEFINED -- ZGYRO OFFSET TC', 54) + ':  '));
  this.getGyroRateDivider(group.addCallback(pad('MPU6050: GYROSCOPE RATE DIVIDER', 54) + ':  '));
  this.getExternalFrameSync(group.addCallback(pad('MPU6050: EXTERNAL FRAME SYNC', 54) + ':  '));
  this.getDigitalLowPassFilterMode(group.addCallback(pad('MPU6050: DIGITAL LOW PASS FILTER MODE', 54) + ':  '));
  this.getAccelXSelfTest(group.addCallback(pad('MPU6050: ACCELEROMETER X SELF TEST', 54) + ':  '));
  this.getAccelYSelfTest(group.addCallback(pad('MPU6050: ACCELEROMETER Y SELF TEST', 54) + ':  '));
  this.getAccelZSelfTest(group.addCallback(pad('MPU6050: ACCELEROMETER Z SELF TEST', 54) + ':  '));
  this.getFullScaleAccelRange(group.addCallback(pad('MPU6050: FULL SCALE ACCEL RANGE', 54) + ':  '));
  this.getDigitalHighPassFilterMode(group.addCallback(pad('MPU6050: DIGITAL HIGH PASS FILTER MODE', 54) + ':  '));
  this.getFreeFallDetectionThreshold(group.addCallback(pad('MPU6050: FREE-FALL DETECTION THRESHOLD', 54) + ':  '));
  this.getFreeFallDurationThreshold(group.addCallback(pad('MPU6050: FREE-FALL DURATION THRESHOLD', 54) + ':  '));
  this.getMotionDetectionThreshold(group.addCallback(pad('MPU6050: MOTION DETECTION THRESHOLD', 54) + ':  '));
  this.getMotionDurationThreshold(group.addCallback(pad('MPU6050: MOTION DURATION THRESHOLD', 54) + ':  '));
  this.getZeroMotionThreshold(group.addCallback(pad('MPU6050: ZERO MOTION THRESHOLD', 54) + ':  '));
  this.getZeroMotionDurationThreshold(group.addCallback(pad('MPU6050: ZERO MOTION DURATION THRESHOLD', 54) + ':  '));
  this.getTempFIFOEnabled(group.addCallback(pad('MPU6050: TEMPERATURE TO FIFO ENABLED', 54) + ':  '));
  this.getXGyroFIFOEnabled(group.addCallback(pad('MPU6050: XGYRO TO FIFO ENABLED', 54) + ':  '));
  this.getYGyroFIFOEnabled(group.addCallback(pad('MPU6050: YGYRO TO FIFO ENABLED', 54) + ':  '));
  this.getZGyroFIFOEnabled(group.addCallback(pad('MPU6050: ZGYRO TO FIFO ENABLED', 54) + ':  '));
  this.getAccelFIFOEnabled(group.addCallback(pad('MPU6050: ACCEL TO FIFO ENABLED', 54) + ':  '));
  this.getSlave2FIFOEnabled(group.addCallback(pad('MPU6050: SLAVE 2 TO FIFO ENABLED', 54) + ':  '));
  this.getSlave1FIFOEnabled(group.addCallback(pad('MPU6050: SLAVE 1 TO FIFO ENABLED', 54) + ':  '));
  this.getSlave0FIFOEnabled(group.addCallback(pad('MPU6050: SLAVE 0 TO FIFO ENABLED', 54) + ':  '));
  this.getMultiMasterEnabled(group.addCallback(pad('MPU6050: MULTI MASTER ENABLED', 54) + ':  '));
  this.getWaitForExternalSensorEnabled(group.addCallback(pad('MPU6050: WAIT FOR EXTERNAL SENSOR ENABLED', 54) + ':  '));
  this.getSlave3FIFOEnabled(group.addCallback(pad('MPU6050: SLAVE3 FIFO ENABLED', 54) + ':  '));
  this.getSlaveReadWriteTransitionEnabled(group.addCallback(pad('MPU6050: SLAVE READ WRITE TRANSITION ENABLED', 54) + ':  '));
  this.getMasterClockSpeed(group.addCallback(pad('MPU6050: MASTER CLOCK SPEED', 54) + ':  '));
  this.getSlaveAddress        (0, group.addCallback(pad('MPU6050: SLAVE0 ADDRESS', 54) + ':  '));
  this.getSlaveRegister       (0, group.addCallback(pad('MPU6050: SLAVE0 REGISTER', 54) + ':  '));
  this.getSlaveEnabled        (0, group.addCallback(pad('MPU6050: SLAVE0 ENABLED', 54) + ':  '));
  this.getSlaveWordByteSwap   (0, group.addCallback(pad('MPU6050: SLAVE0 WORD BYTE SWAP', 54) + ':  '));
  this.getSlaveWriteMode      (0, group.addCallback(pad('MPU6050: SLAVE0 WRITE MODE', 54) + ':  '));
  this.getSlaveWordGroupOffset(0, group.addCallback(pad('MPU6050: SLAVE0 WORD GROUP OFFSET', 54) + ':  '));
  this.getSlaveDataLength     (0, group.addCallback(pad('MPU6050: SLAVE0 DATA LENGTH', 54) + ':  '));
  this.getSlaveAddress        (1, group.addCallback(pad('MPU6050: SLAVE1 ADDRESS', 54) + ':  '));
  this.getSlaveRegister       (1, group.addCallback(pad('MPU6050: SLAVE1 REGISTER', 54) + ':  '));
  this.getSlaveEnabled        (1, group.addCallback(pad('MPU6050: SLAVE1 ENABLED', 54) + ':  '));
  this.getSlaveWordByteSwap   (1, group.addCallback(pad('MPU6050: SLAVE1 WORD BYTE SWAP', 54) + ':  '));
  this.getSlaveWriteMode      (1, group.addCallback(pad('MPU6050: SLAVE1 WRITE MODE', 54) + ':  '));
  this.getSlaveWordGroupOffset(1, group.addCallback(pad('MPU6050: SLAVE1 WORD GROUP OFFSET', 54) + ':  '));
  this.getSlaveDataLength     (1, group.addCallback(pad('MPU6050: SLAVE1 DATA LENGTH', 54) + ':  '));
  this.getSlaveAddress        (2, group.addCallback(pad('MPU6050: SLAVE2 ADDRESS', 54) + ':  '));
  this.getSlaveRegister       (2, group.addCallback(pad('MPU6050: SLAVE2 REGISTER', 54) + ':  '));
  this.getSlaveEnabled        (2, group.addCallback(pad('MPU6050: SLAVE2 ENABLED', 54) + ':  '));
  this.getSlaveWordByteSwap   (2, group.addCallback(pad('MPU6050: SLAVE2 WORD BYTE SWAP', 54) + ':  '));
  this.getSlaveWriteMode      (2, group.addCallback(pad('MPU6050: SLAVE2 WRITE MODE', 54) + ':  '));
  this.getSlaveWordGroupOffset(2, group.addCallback(pad('MPU6050: SLAVE2 WORD GROUP OFFSET', 54) + ':  '));
  this.getSlaveDataLength     (2, group.addCallback(pad('MPU6050: SLAVE2 DATA LENGTH', 54) + ':  '));
  this.getSlaveAddress        (3, group.addCallback(pad('MPU6050: SLAVE3 ADDRESS', 54) + ':  '));
  this.getSlaveRegister       (3, group.addCallback(pad('MPU6050: SLAVE3 REGISTER', 54) + ':  '));
  this.getSlaveEnabled        (3, group.addCallback(pad('MPU6050: SLAVE3 ENABLED', 54) + ':  '));
  this.getSlaveWordByteSwap   (3, group.addCallback(pad('MPU6050: SLAVE3 WORD BYTE SWAP', 54) + ':  '));
  this.getSlaveWriteMode      (3, group.addCallback(pad('MPU6050: SLAVE3 WRITE MODE', 54) + ':  '));
  this.getSlaveWordGroupOffset(3, group.addCallback(pad('MPU6050: SLAVE3 WORD GROUP OFFSET', 54) + ':  '));
  this.getSlaveDataLength     (3, group.addCallback(pad('MPU6050: SLAVE3 DATA LENGTH', 54) + ':  '));
  this.getSlave4Address(group.addCallback(pad('MPU6050: SLAVE4 ADDRESS', 54) + ':  '));
  this.getSlave4Register(group.addCallback(pad('MPU6050: SLAVE4 REGISTER', 54) + ':  '));
  this.getSlave4Enabled(group.addCallback(pad('MPU6050: SLAVE4 ENABLED', 54) + ':  '));
  this.getSlave4InterruptEnabled(group.addCallback(pad('MPU6050: SLAVE4 INTERRUPT ENABLED', 54) + ':  '));
  this.getSlave4WriteMode(group.addCallback(pad('MPU6050: SLAVE4 WRITE MODE', 54) + ':  '));
  this.getSlave4MasterDelay(group.addCallback(pad('MPU6050: SLAVE4 MASTER DELAY', 54) + ':  '));
  this.getSlave4InputByte(group.addCallback(pad('MPU6050: SLAVE4 INPUT BYTE', 54) + ':  '));
  this.getPassthroughStatus(group.addCallback(pad('MPU6050: PASS THROUGH STATUS', 54) + ':  '));
  this.getSlave4TransactionDoneStatus(group.addCallback(pad('MPU6050: SLAVE4 TRANSACTION DONE STATUS', 54) + ':  '));
  this.getLostArbitration(group.addCallback(pad('MPU6050: LOST ARBITRATION', 54) + ':  '));
  this.getSlave4Nack(group.addCallback(pad('MPU6050: SLAVE4 NACK', 54) + ':  '));
  this.getSlave3Nack(group.addCallback(pad('MPU6050: SLAVE3 NACK', 54) + ':  '));
  this.getSlave2Nack(group.addCallback(pad('MPU6050: SLAVE2 NACK', 54) + ':  '));
  this.getSlave1Nack(group.addCallback(pad('MPU6050: SLAVE1 NACK', 54) + ':  '));
  this.getSlave0Nack(group.addCallback(pad('MPU6050: SLAVE0 NACK', 54) + ':  '));
  this.getInterruptMode(group.addCallback(pad('MPU6050: INTERRUPT MODE', 54) + ':  '));
  this.getInterruptDrive(group.addCallback(pad('MPU6050: INTERRUPT DRIVE', 54) + ':  '));
  this.getInterruptLatch(group.addCallback(pad('MPU6050: INTERRUPT LATCH', 54) + ':  '));
  this.getInterruptLatchClear(group.addCallback(pad('MPU6050: INTERRUPT LATCH CLEAR', 54) + ':  '));
  this.getFSyncInterruptLevel(group.addCallback(pad('MPU6050: FSYNC INTERRUPT LEVEL', 54) + ':  '));
  this.getFSyncInterruptEnabled(group.addCallback(pad('MPU6050: FSYNC INTERRUPT ENABLED', 54) + ':  '));
  this.getI2CBypassEnabled(group.addCallback(pad('MPU6050: I2C BYPASS ENABLED', 54) + ':  '));
  this.getClockOutputEnabled(group.addCallback(pad('MPU6050: CLOCK OUTPUT ENABLED', 54) + ':  '));
  this.getIntEnabled(group.addCallback(pad('MPU6050: INT ENABLED', 54) + ':  '));
  this.getIntFreefallEnabled(group.addCallback(pad('MPU6050: INT FREE FALL ENABLED', 54) + ':  '));
  this.getIntMotionEnabled(group.addCallback(pad('MPU6050: INT MOTION ENABLED', 54) + ':  '));
  this.getIntZeroMotionEnabled(group.addCallback(pad('MPU6050: INT ZERO MOTION ENABLED', 54) + ':  '));
  this.getIntFIFOBufferOverflowEnabled(group.addCallback(pad('MPU6050: INT FIFO BUFFER OVERFLOW ENABLED', 54) + ':  '));
  this.getIntI2CMasterEnabled(group.addCallback(pad('MPU6050: INT I2C MASTER ENABLED', 54) + ':  '));
  this.getIntDataReadyEnabled(group.addCallback(pad('MPU6050: INT DATA READY ENABLED', 54) + ':  '));
  this.getIntStatus(group.addCallback(pad('MPU6050: INT STATUS', 54) + ':  '));
  this.getIntFreefallStatus(group.addCallback(pad('MPU6050: INT FREEFALL STATUS', 54) + ':  '));
  this.getIntMotionStatus(group.addCallback(pad('MPU6050: INT MOTION STATUS', 54) + ':  '));
  this.getIntZeroMotionStatus(group.addCallback(pad('MPU6050: INT ZERO MOTION STATUS', 54) + ':  '));
  this.getIntFIFOBufferOverflowStatus(group.addCallback(pad('MPU6050: INT FIFO BUFFER OVERFLOW STATUS', 54) + ':  '));
  this.getIntI2CMasterStatus(group.addCallback(pad('MPU6050: INT I2C MASTER STATUS', 54) + ':  '));
  this.getIntDataReadyStatus(group.addCallback(pad('MPU6050: INT DATA READY STATUS', 54) + ':  '));
  //this.getMotion9(group.addCallback(pad('MPU6050: MOTION9', 54) + ':  '));
  this.getMotion6(group.addCallback(pad('MPU6050: MOTION6', 54) + ':  '));
  this.getMotion6Raw(group.addCallback(pad('MPU6050: MOTION6 RAW', 54) + ':  '));
  this.getAcceleration(group.addCallback(pad('MPU6050: ACCELERATION', 54) + ':  '));
  this.getAccelerationX(group.addCallback(pad('MPU6050: ACCELERATION X', 54) + ':  '));
  this.getAccelerationY(group.addCallback(pad('MPU6050: ACCELERATION Y', 54) + ':  '));
  this.getAccelerationZ(group.addCallback(pad('MPU6050: ACCELERATION Z', 54) + ':  '));
  this.getTemperature(group.addCallback(pad('MPU6050: TEMPERATURE', 54) + ':  '));
  this.getRotation(group.addCallback(pad('MPU6050: ROTATION', 54) + ':  '));
  this.getRotationX(group.addCallback(pad('MPU6050: ROTATION X', 54) + ':  '));
  this.getRotationY(group.addCallback(pad('MPU6050: ROTATION Y', 54) + ':  '));
  this.getRotationZ(group.addCallback(pad('MPU6050: ROTATION Z', 54) + ':  '));
  //this.getExternalSensorByte(group.addCallback(pad('MPU6050: EXTERNALSENSORBYTE', 54) + ':  '));
  //this.getExternalSensorWord(group.addCallback(pad('MPU6050: EXTERNALSENSORWORD', 54) + ':  '));
  //this.getExternalSensorDWord(group.addCallback(pad('MPU6050: EXTERNALSENSORDWORD', 54) + ':  '));
  this.getMotionStatus(group.addCallback(pad('MPU6050: MOTION STATUS', 54) + ':  '));
  this.getXNegMotionDetected(group.addCallback(pad('MPU6050: X NEG MOTION DETECTED', 54) + ':  '));
  this.getXPosMotionDetected(group.addCallback(pad('MPU6050: X POS MOTION DETECTED', 54) + ':  '));
  this.getYNegMotionDetected(group.addCallback(pad('MPU6050: Y NEG MOTION DETECTED', 54) + ':  '));
  this.getYPosMotionDetected(group.addCallback(pad('MPU6050: Y POS MOTION DETECTED', 54) + ':  '));
  this.getZNegMotionDetected(group.addCallback(pad('MPU6050: Z NEG MOTION DETECTED', 54) + ':  '));
  this.getZPosMotionDetected(group.addCallback(pad('MPU6050: Z POS MOTION DETECTED', 54) + ':  '));
  this.getZeroMotionDetected(group.addCallback(pad('MPU6050: ZERO MOTION DETECTED', 54) + ':  '));
  this.getExternalShadowDelayEnabled(group.addCallback(pad('MPU6050: EXTERNAL SHADOW DELAY ENABLED', 54) + ':  '));
  this.getSlaveDelayEnabled   (0, group.addCallback(pad('MPU6050: SLAVE0 DELAY ENABLED', 54) + ':  '));
  this.getSlaveDelayEnabled   (1, group.addCallback(pad('MPU6050: SLAVE1 DELAY ENABLED', 54) + ':  '));
  this.getSlaveDelayEnabled   (2, group.addCallback(pad('MPU6050: SLAVE2 DELAY ENABLED', 54) + ':  '));
  this.getSlaveDelayEnabled   (3, group.addCallback(pad('MPU6050: SLAVE3 DELAY ENABLED', 54) + ':  '));
  this.getSlaveDelayEnabled   (4, group.addCallback(pad('MPU6050: SLAVE4 DELAY ENABLED', 54) + ':  '));
  this.getAccelerometerPowerOnDelay(group.addCallback(pad('MPU6050: ACCELEROMETER POWER ON DELAY', 54) + ':  '));
  this.getFreefallDetectionCounterDecrement(group.addCallback(pad('MPU6050: FREE FALL DETECTION COUNTER DECREMENT', 54) + ':  '));
  this.getMotionDetectionCounterDecrement(group.addCallback(pad('MPU6050: MOTION DETECTION COUNTER DECREMENT', 54) + ':  '));
  this.getFIFOEnabled(group.addCallback(pad('MPU6050: FIFO ENABLED', 54) + ':  '));
  this.getI2CMasterModeEnabled(group.addCallback(pad('MPU6050: I2C MASTER MODE ENABLED', 54) + ':  '));
  this.getSleepEnabled(group.addCallback(pad('MPU6050: SLEEP ENABLED', 54) + ':  '));
  this.getWakeCycleEnabled(group.addCallback(pad('MPU6050: WAKE CYCLE ENABLED', 54) + ':  '));
  this.getTempSensorEnabled(group.addCallback(pad('MPU6050: TEMP SENSOR ENABLED', 54) + ':  '));
  this.getClockSource(group.addCallback(pad('MPU6050: CLOCK SOURCE', 54) + ':  '));
  this.getWakeFrequency(group.addCallback(pad('MPU6050: WAKE FREQUENCY', 54) + ':  '));
  this.getStandbyXAccelEnabled(group.addCallback(pad('MPU6050: STANDBY X ACCEL ENABLED', 54) + ':  '));
  this.getStandbyYAccelEnabled(group.addCallback(pad('MPU6050: STANDBY Y ACCEL ENABLED', 54) + ':  '));
  this.getStandbyZAccelEnabled(group.addCallback(pad('MPU6050: STANDBY Z ACCEL ENABLED', 54) + ':  '));
  this.getStandbyXGyroEnabled(group.addCallback(pad('MPU6050: STANDBY X GYRO ENABLED', 54) + ':  '));
  this.getStandbyYGyroEnabled(group.addCallback(pad('MPU6050: STANDBY Y GYRO ENABLED', 54) + ':  '));
  this.getStandbyZGyroEnabled(group.addCallback(pad('MPU6050: STANDBY Z GYRO ENABLED', 54) + ':  '));
  this.getFIFOCount(group.addCallback(pad('MPU6050: FIFO COUNT', 54) + ':  '));
  //this.getFIFOByte(group.addCallback(pad('MPU6050: FIFO BYTE', 54) + ':  '));
  //this.getFIFOBytes(group.addCallback(pad('MPU6050: FIFO BYTES', 54) + ':  '));
  this.getDeviceID(group.addCallback(pad('MPU6050: DEVICE ID', 54) + ':  '));
  this.getOTPBankValid(group.addCallback(pad('MPU6050: OTP BANK VALID', 54) + ':  '));
  this.getXGyroOffsetTC(group.addCallback(pad('MPU6050: X GYRO OFFSET TC', 54) + ':  '));
  this.getYGyroOffsetTC(group.addCallback(pad('MPU6050: Y GYRO OFFSET TC', 54) + ':  '));
  this.getZGyroOffsetTC(group.addCallback(pad('MPU6050: Z GYRO OFFSET TC', 54) + ':  '));
  this.getXFineGain(group.addCallback(pad('MPU6050: X FINE GAIN', 54) + ':  '));
  this.getYFineGain(group.addCallback(pad('MPU6050: Y FINE GAIN', 54) + ':  '));
  this.getZFineGain(group.addCallback(pad('MPU6050: Z FINE GAIN', 54) + ':  '));
  this.getXAccelOffset(group.addCallback(pad('MPU6050: X ACCEL OFFSET', 54) + ':  '));
  this.getYAccelOffset(group.addCallback(pad('MPU6050: Y ACCEL OFFSET', 54) + ':  '));
  this.getZAccelOffset(group.addCallback(pad('MPU6050: Z ACCEL OFFSET', 54) + ':  '));
  this.getXGyroOffset(group.addCallback(pad('MPU6050: X GYRO OFFSET', 54) + ':  '));
  this.getYGyroOffset(group.addCallback(pad('MPU6050: Y GYRO OFFSET', 54) + ':  '));
  this.getZGyroOffset(group.addCallback(pad('MPU6050: Z GYRO OFFSET', 54) + ':  '));
  this.getIntPLLReadyEnabled(group.addCallback(pad('MPU6050: INT PLL READY ENABLED', 54) + ':  '));
  this.getIntDMPEnabled(group.addCallback(pad('MPU6050: INT DMP ENABLED', 54) + ':  '));
  this.getDMPInt5Status(group.addCallback(pad('MPU6050: DMP INT5 STATUS', 54) + ':  '));
  this.getDMPInt4Status(group.addCallback(pad('MPU6050: DMP INT4 STATUS', 54) + ':  '));
  this.getDMPInt3Status(group.addCallback(pad('MPU6050: DMP INT3 STATUS', 54) + ':  '));
  this.getDMPInt2Status(group.addCallback(pad('MPU6050: DMP INT2 STATUS', 54) + ':  '));
  this.getDMPInt1Status(group.addCallback(pad('MPU6050: DMP INT1 STATUS', 54) + ':  '));
  this.getDMPInt0Status(group.addCallback(pad('MPU6050: DMP INT0 STATUS', 54) + ':  '));
  this.getIntPLLReadyStatus(group.addCallback(pad('MPU6050: INT PLL READY STATUS', 54) + ':  '));
  this.getIntDMPStatus(group.addCallback(pad('MPU6050: INT DMP STATUS', 54) + ':  '));
  this.getDMPEnabled(group.addCallback(pad('MPU6050: DMP ENABLED', 54) + ':  '));
  this.getDMPConfig1(group.addCallback(pad('MPU6050: DMP CONFIG1', 54) + ':  '));
  this.getDMPConfig2(group.addCallback(pad('MPU6050: DMP CONFIG2', 54) + ':  '));
};


MPU6050.prototype.calibrate = function(callback) {
  this.log('MPU6050: Calibration begun.  This could take a minute...');
  console.time('MPU6050: calibration complete');
  var device = this;
  var down = this.accelerometer.denominator;

  this.log('MPU6050:   calibration warmup');
  this.warmup(device.warmups, function() {
    device.log('MPU6050:   calibration warmup complete.');
    var target = {
      ax:   { zero: 0,    move: 1000, tolerance: 50 },
      ay:   { zero: 0,    move: 1000, tolerance: 50 },
      az:   { zero: down, move: 1000, tolerance: 50 },
      tmp:  { zero: 0,    move: 0,    tolerance: 100 },
      gy:   { zero: 0,    move: 50,   tolerance: 15 },
      gx:   { zero: 0,    move: 50,   tolerance: 15 },
      gz:   { zero: 0,    move: 50,   tolerance: 15 }
    };
    device.log('MPU6050:   calibration');
    device.recursiveCalibration(100, target, function(x) {
      device.log('MPU6050:   calibration complete.');
      callback(x);
    });
  });
};

MPU6050.prototype.warmup = function(warmups, callback) {
  this.logAppend('W');

  var device = this;
  this.sampleMotion6Raw(1000, function(avgs) {
    //device.log('Warm up: ' + warmups);
    //device.log(avgs);
    if (warmups > 0) device.warmup(warmups - 1, callback);
    else callback();
  });
};

MPU6050.prototype.recursiveCalibration = function(samples, target, callback) {
  this.logAppend('C');

  var device = this;
  this.sampleMotion6Raw(samples, function(avgs) {
    //device.log('Accelerometer Averages:');
    //console.dir(avgs);

    if (!device.isCalibrated(avgs, target)) {
      device.getOffsets(function(offsets) {
        //device.log('Offsets:');
        //console.dir(offsets);

        var sample = { avgs: avgs, offsets: offsets };
        device.calculateOffsetCorrections(sample, target);
        //device.log('Corrections:');
        //console.dir(corrections);

        device.adjustOffsets(target, function() {
          //device.log('Adjustments Made.');

          device.recursiveCalibration(samples, target, callback);
        });
      });
    }
    else {
      console.timeEnd('MPU6050: calibration complete');
      callback(avgs);
    }
  });
};

MPU6050.prototype.sampleMotion6Raw = function(count, callback) {
  var sums = [0, 0, 0, 0, 0, 0, 0, 0];
  this.sampleMotion6RawRecurse(sums, count, callback);
};

MPU6050.prototype.sampleMotion6RawRecurse = function(sums, count, callback) {
  var device = this;
  this.getMotion6Raw(function(err, raw) {
    for (var i = 0; i < raw.length; i++) {
      var sum = sums[i] + raw[i];
      if (Number.MAX_VALUE < sum) throw new Error('Number too large!');
      else sums[i] = sum;
    }

    sums[7]++;
    if (sums[7] < count) device.sampleMotion6RawRecurse(sums, count, callback);
    else {
      var cnt = sums[7];
      callback({
        ax:  Math.round(sums[0] / cnt),
        ay:  Math.round(sums[1] / cnt),
        az:  Math.round(sums[2] / cnt),
        tmp: Math.round(sums[3] / cnt),
        gx:  Math.round(sums[4] / cnt),
        gy:  Math.round(sums[5] / cnt),
        gz:  Math.round(sums[6] / cnt)
      });
    }
  });
};

MPU6050.prototype.isCalibrated = function(avgs, target) {
  var allCalibrated = true;
  for (var n in avgs) {
    var tgt = target[n];
    tgt.calibrated = Math.abs(avgs[n] - tgt.zero) < tgt.tolerance;
    if (!tgt.calibrated) allCalibrated = false;
  }
  //console.dir(target);
  return allCalibrated;
};

MPU6050.prototype.getOffsets = function(callback) {
  var offsets = {};
  var group = new Group(this, function() { callback(offsets); });

  this.getXAccelOffset(group.addCallback('ax', offsets));
  this.getYAccelOffset(group.addCallback('ay', offsets));
  this.getZAccelOffset(group.addCallback('az', offsets));
  this.getXGyroOffset(group.addCallback('gx', offsets));
  this.getYGyroOffset(group.addCallback('gy', offsets));
  this.getZGyroOffset(group.addCallback('gz', offsets));
};

MPU6050.prototype.calculateOffsetCorrections = function(sample, target) {
  var correction = {};
  for (var n in sample.avgs) {
    var tgt = target[n];
    if (tgt.calibrated) continue;

    if (sample.avgs[n] > tgt.zero) {
      // Sensor values are too high
      if (tgt.move > 0) {
        // Direction Changed - Reduce Magnitude
        tgt.move = Math.ceil(tgt.move / 3) * -1;
      }
      tgt.offset = sample.offsets[n] + tgt.move;
    }
    else if (sample.avgs[n] < tgt.zero) {
      // Sensor values are too low
      if (tgt.move < 0) {
        // Direction Changed - Reduce Magnitude
        tgt.move = Math.ceil(tgt.move / 3) * -1;
      }
      tgt.offset = sample.offsets[n] + tgt.move;
    }
    else {
      // Sensor value is perfect
      tgt.move = 0;
    }

    //this.log('offset ' + n + ': ' + sample.offsets[n] + ' -- avg ' + n + ': ' + sample.avgs[n] + ' -- correction: ' + tgt.move);
  }
};

MPU6050.prototype.adjustOffsets = function(target, callback) {
  var group = new Group(this, callback);
  this.setXAccelOffset(target.ax.offset, group.addCallback());
  this.setYAccelOffset(target.ay.offset, group.addCallback());
  this.setZAccelOffset(target.az.offset, group.addCallback());
  this.setXGyroOffset(target.gx.offset, group.addCallback());
  this.setYGyroOffset(target.gy.offset, group.addCallback());
  this.setZGyroOffset(target.gz.offset, group.addCallback());
};

// --- NON INITIALIZATION SETTINGS ---










/**
 * Get 3-axis accelerometer readings.
 * These registers store the most recent accelerometer measurements.
 * Accelerometer measurements are written to these registers at the Sample Rate
 * as defined in Register 25.
 *
 * The accelerometer measurement registers, along with the temperature
 * measurement registers, gyroscope measurement registers, and external sensor
 * data registers, are composed of two sets of registers: an internal register
 * set and a user-facing read register set.
 *
 * The data within the accelerometer sensors' internal register set is always
 * updated at the Sample Rate. Meanwhile, the user-facing read register set
 * duplicates the internal register set's data values whenever the serial
 * interface is idle. This guarantees that a burst read of sensor registers will
 * read measurements from the same sampling instant. Note that if burst reads
 * are not used, the user is responsible for ensuring a set of single byte reads
 * correspond to a single sampling instant by checking the Data Ready interrupt.
 *
 * Each 16-bit accelerometer measurement has a full scale defined in ACCEL_FS
 * (Register 28). For each full scale setting, the accelerometers' sensitivity
 * per LSB in ACCEL_xOUT is shown in the table below:
 *
 * <pre>
 * AFS_SEL | Full Scale Range | LSB Sensitivity
 * --------+------------------+----------------
 * 0       | +/- 2g           | 8192 LSB/mg
 * 1       | +/- 4g           | 4096 LSB/mg
 * 2       | +/- 8g           | 2048 LSB/mg
 * 3       | +/- 16g          | 1024 LSB/mg
 * </pre>
 *
 * @return An array containing the three accellerations.
 */
MPU6050.prototype.getAcceleration = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ACCEL_XOUT_H, 6, function(err, buffer) {
    callback(err, [
      buffer.readInt16BE(0),
      buffer.readInt16BE(2),
      buffer.readInt16BE(4)
    ]);
  });
};

/**
 * Get raw 6-axis motion sensor readings (accel/gyro).
 * Retrieves all currently available motion sensor values.
 * @see getAcceleration()
 * @see getRotation()
 */
MPU6050.prototype.getMotion6Raw = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_ACCEL_XOUT_H, 14, function(err, buffer) {
    callback(err, [
      buffer.readInt16BE(0),
      buffer.readInt16BE(2),
      buffer.readInt16BE(4),
      (buffer.readInt16BE(6) + 12412.0) / 340.0,
      buffer.readInt16BE(8),
      buffer.readInt16BE(10),
      buffer.readInt16BE(12)
    ]);
  });
};

/**
 * Get filtered 6-axis motion sensor readings (accel/gyro).
 * Retrieves all currently available motion sensor values.
 * @see getAcceleration()
 * @see getRotation()
 */
MPU6050.prototype.getMotion6 = function(callback) {
  var mpu = this;
  this.i2cdev.readBytes(MPU6050.RA_ACCEL_XOUT_H, 14, function(err, buffer) {
    var aDeno = mpu.accelerometer.denominator;
    var gDeno = mpu.gyroscope.denominator;
    callback(err, [
      (buffer.readInt16BE(0) / aDeno),
      (buffer.readInt16BE(2) / aDeno),
      (buffer.readInt16BE(4) / aDeno),
      (buffer.readInt16BE(6) + 12412.0) / 340.0,
      (buffer.readInt16BE(8) / gDeno),
      (buffer.readInt16BE(10) / gDeno),
      (buffer.readInt16BE(12) / gDeno)
    ]);
  });
};

/**
 * Get 3-axis gyroscope readings.
 * These gyroscope measurement registers, along with the accelerometer
 * measurement registers, temperature measurement registers, and external sensor
 * data registers, are composed of two sets of registers: an internal register
 * set and a user-facing read register set.
 * The data within the gyroscope sensors' internal register set is always
 * updated at the Sample Rate. Meanwhile, the user-facing read register set
 * duplicates the internal register set's data values whenever the serial
 * interface is idle. This guarantees that a burst read of sensor registers will
 * read measurements from the same sampling instant. Note that if burst reads
 * are not used, the user is responsible for ensuring a set of single byte reads
 * correspond to a single sampling instant by checking the Data Ready interrupt.
 *
 * Each 16-bit gyroscope measurement has a full scale defined in FS_SEL
 * (Register 27). For each full scale setting, the gyroscopes' sensitivity per
 * LSB in GYRO_xOUT is shown in the table below:
 *
 * <pre>
 * FS_SEL | Full Scale Range   | LSB Sensitivity
 * -------+--------------------+----------------
 * 0      | +/- 250 degrees/s  | 131 LSB/deg/s
 * 1      | +/- 500 degrees/s  | 65.5 LSB/deg/s
 * 2      | +/- 1000 degrees/s | 32.8 LSB/deg/s
 * 3      | +/- 2000 degrees/s | 16.4 LSB/deg/s
 * </pre>
 *
 * @param x 16-bit signed integer container for X-axis rotation
 * @param y 16-bit signed integer container for Y-axis rotation
 * @param z 16-bit signed integer container for Z-axis rotation
 * @see getMotion6()
 */
MPU6050.prototype.getRotation = function(callback) {
  this.i2cdev.readBytes(MPU6050.RA_GYRO_XOUT_H, 6, function(err, buffer) {
    callback(err, [buffer.readInt16BE(0), buffer.readInt16BE(2), buffer.readInt16BE(4)]);
  });
};

MPU6050.prototype.log = function(msg) {
  if (this.debug) process.stdout.write(msg + '\n');
};

MPU6050.prototype.logAppend = function(msg) {
  if (this.debug) process.stdout.write(msg);
};

module.exports = MPU6050;

// --- General Utility Functions ---

function Group(device, callback) {
  var group = this;
  group.waiting = 0;
  group.addCallback = function(text, obj) {
    group.waiting++;
    return function(err, res) {
      if (obj && text) obj[text] = res;
      else if (text) device.log(text + res, res);
      if (--group.waiting === 0) callback();
    }
  }
}

var whitespace = '';
var padding = [whitespace];
for (var i = 1; i < 40; i++) {
  whitespace += ' ';
  padding.push(whitespace);
}

function pad(str, len, left) {
  var pad = len - str.length;
  if (left) return padding[pad] + str;
  else return str + padding[pad];
}
