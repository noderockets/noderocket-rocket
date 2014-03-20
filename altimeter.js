var Cylon = require('cylon');
var events = require('events');
var _ = require('underscore');

function Altimeter(opts) {
    this.config = _.extend({
        dataInterval: 100,
        mode: 1
    }, opts);

    events.EventEmitter.call(this);
    var thiz = this;

    Cylon.robot({
        connection:{name:'raspi', adaptor:'raspi'},
        device:{name:'bmp180', driver:'bmp180'},

        work: function(my) {
            every(thiz.config.dataInterval, function() {
                my.bmp180.getAltitude(thiz.config.mode, null, function(err, val) {
                    if(err) console.log(err);
                    else {
                        thiz.emit('data', val);
                    }
                });
            });
        }
    }).start();
}

Altimeter.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Altimeter;
