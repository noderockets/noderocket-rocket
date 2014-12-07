module.exports = function (rocket) {
  console.log('Using timer based strategy');

  rocket.on('launched', function() {
    console.log('Deploying parachute in 5s');
    setTimeout(function(){
      console.log('Deploy parachute now!');
      rocket.deployParachute();
    }, 2500);
  });
};