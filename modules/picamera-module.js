var util = require('util');
var RocketModule = require('../rocket-module');
var RaspiCam = require('raspicam');
var _ = require('underscore');

function CameraModule(rocket, io, app) {
  RocketModule.call(this, "camera", rocket, io, app);
  var module = this;
  var camera;

  this.ui = {
    actions: {
      photo:        '/camera/photo',
      video:        '/camera/video',
      'video-stop': '/camera/video/stop',
      file:         '/camera/media/:file'
    }
  };

  app.get('/camera/photo', function(req, res) {
    var opts = _.extend({
      output: '/home/pi/media/noderocket_' + new Date().valueOf() + '.jpg',
      h: 1944,
      w: 2592,
      q: 80,
      t: 2
    }, req.query);
    opts.mode = 'photo';

    camera = new RaspiCam(opts);
    camera.start();
    camera.on('exit', function() {
      res.sendFile(opts.output);
    });
  });

  app.get('/camera/video', function(req, res) {
    var opts = _.extend({
      output: '/home/pi/media/noderocket_' + new Date().valueOf() + '.h264',
      h: 640,
      w: 480,
      framerate: 90,
      t: 30000
    },  req.query);

    opts.mode = 'video';

    module.log('Starting video with the following options: %j', opts);

    camera = new RaspiCam(opts);
    var success = camera.start();

    if(success) {
      res.send(opts);

    } else {
      res.send(500, 'failed to start video');
    }
  });


  app.get('/camera/video/stop', function(req, res) {
    module.log('Stopping video');
    var success = camera.stop();
    if(success) {
      res.send('video stoped');
    } else {
      res.send('no video recording')
    }
  });


  app.get('/camera/media/:file', function(req, res) {
    var options = {
      root: '/home/pi/media/',
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    };
    res.sendFile(req.params.file, options);
  });


  this.enable();
}

util.inherits(CameraModule, RocketModule);

CameraModule.prototype.doEnable = function() {
  if(!this.enabled) {
  }
};

CameraModule.prototype.doDisable = function() {
  if(this.enabled) {
  }
};

module.exports = CameraModule;