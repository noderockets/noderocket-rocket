var socket = io.connect();
socket.on('ready', function (data) {
  console.log('Launcher Ready!',data);
});

socket.on('hello', function(data) {
  console.log('Hello, Rocket!');
  socket.emit('start', {
    dataInterval: 100
  });
});

socket.on('data', function (data) {
  //console.log('Data', data);
  if(data.alt) addData(data.alt);
});

