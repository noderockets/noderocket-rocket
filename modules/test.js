module.exports = function(rocket, io) {

  console.log('initializing test module')

  rocket.on('rocket.ready', function() {
    console.log('Got rocket ready event');
  });

  rocket.on('rocket.data', function(data) {
    //console.log('Got rocket data: ', data);

    io.sockets.emit('my-custom-event', "test");
  });


  return {
    /* Unique name of module */
    name: "test-module",

    /*  Enable this module */
    enable: function() {
      console.log('enabling test module')
    },

    /* Disable this module */
    disable: function() {
      console.log('disabling test module');
    }
  }
};