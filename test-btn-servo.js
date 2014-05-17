var Cylon = require("cylon");

var robot = Cylon.robot({
  connection: { name: 'raspi', adaptor: 'raspi' },
  devices: [
    { name: 'button', driver: 'button', pin: 16},
    { name: 'button2', driver: 'button', pin: 11},
    { name: 'led', driver: 'led', pin: 18 },
    { name: 'led2', driver: 'led', pin: 15},
    { name: 'servo', driver: 'servo', pin: 12},
//    { name: 'bmp180', driver: 'bmp180' },
  ],

  work: function (my) {
    my.servo.angle(0);

    my.button.on('push', function () {
      console.log('Button 1 push');
      my.led.turnOn();
      my.servo.angle(135);
    });

    my.button.on('release', function () {
      console.log('Button 1 release');
      my.led.turnOff();
      my.servo.angle(0);
    });
/*
    my.button2.on('push', function () {
      console.log('Button 2 push');
      my.led2.turnOn();
//      my.led2.toggle()
    });

    my.button2.on('release', function () {
      console.log('Button 2 release');
      my.led2.turnOff();
//      my.led2.toggle()
    });

    every((100).second(), function() {
      my.bmp180.getAltitude(1, null, function (err, val) {
        console.log(err, val);
      });
    });*/
  }
});

// start working
robot.start();
