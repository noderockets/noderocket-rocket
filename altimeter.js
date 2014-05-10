var Cylon = require('cylon');
var events = require('events');
var _ = require('underscore');

function Altimeter(opts) {
    this.config = _.extend({
        dataInterval: 100,
        mode: 1,
        servoInitAngle: 150,
        servoReleaseAngle: 60,
        armAltDelta: 3,
        deployAltDelta: .5
    }, opts);

    events.EventEmitter.call(this);
    var thiz = this;
    var activated = false;
    var armed = false;
    var deployed = false;
    var initialAltitude = null;
    var maxAltitude = null;

    Cylon.robot({
        connection:{name:'raspi', adaptor:'raspi'},
        devices:[{name:'bmp180', driver:'bmp180'},
                {name:'servo', driver:'servo', pin:12}],

        work: function(my) {
            Logger.debug('Setting angle to ' + thiz.config.servoInitAngle);
            my.servo.angle(thiz.config.servoInitAngle);
            thiz.on('init', function() {
                Logger.debug('Setting angle to ' + thiz.config.servoInitAngle);
                my.servo.angle(thiz.config.servoInitAngle);
                activated = false;
                armed = false;
                deployed = false;
                initialAltitude = null;
                maxAltitude = null;
            });
            thiz.on('parachute', function() {
                Logger.debug('Setting angle to ' + thiz.config.servoReleaseAngle);
                my.servo.angle(thiz.config.servoReleaseAngle);
            });
            thiz.on('activate', function() {
                Logger.debug('Activated');
                activated = true;
            });
            every(thiz.config.dataInterval, function() {
                my.bmp180.getAltitude(thiz.config.mode, null, function(err, val) {
                    if(activated) {
                        if(initialAltitude === null) {
                            initialAltitude = val.alt;
                        }
                        else if(armed === false && (val.alt - initialAltitude >= thiz.config.armAltDelta)) {
                            armed = true;
                            thiz.emit('armed');
                        }
                        else if(armed === true && deployed !== true) {
                            if(val.alt > maxAltitude) {
                                maxAltitude = val.alt;
                                thiz.emit('maxAltitude', {alt: maxAltitude});
                            }
                            else if (maxAltitude - val.alt >= thiz.config.deployAltDelta) {
                                thiz.emit('parachute', {alt: val.alt});
                                deployed = true;
                            }
                        }
                    }
                    if(err) console.log(err);
                    else {
                        thiz.emit('data', val);
                    }
                });
            });
        }
    }).start();

    this.setServoInitAngle = function(angle) {
        this.config.servoInitAngle = angle;
    }

    this.setServoReleaseAngle = function(angle) {
        this.config.servoReleaseAngle = angle;
    }
}

Altimeter.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Altimeter;
