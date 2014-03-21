/**
 * Created by validity on 3/20/14.
 */
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
    devices:[
      {name:'gyro', driver:'l3g4200d'}
    ],

    work: function(my) {
      every(thiz.config.dataInterval, function() {
        my.gyro.getGyroValues(function(err, val) {
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
