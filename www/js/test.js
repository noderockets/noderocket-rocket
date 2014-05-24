/* global rocketInfo*/
(function () {
  'use strict';

  // --- Driver Code -----------------------------------------------------------

  var chartEl = document.querySelector('#chart');
  var logEl = document.querySelector('#msgs');

  var info = rocketInfo(chartEl, logEl);

  // info.chart.addData(altitude, time);
  // info.chart.addMessage(altitude, time, message);
  // info.chart.reset();
  // info.chart.baseAlt(altitude);

  // info.log.append(message, time);
  // info.log.clear();

  document.querySelector('#log a').addEventListener('click', info.log.clear);
  document.querySelector('#chart a').addEventListener('click', info.chart.reset);


  // --- TESTING ---------------------------------------------------------------

  var OFFSET = 400;
  // info.chart.baseAlt(OFFSET);

  info.log.append('Rocket Ready', new Date());
  info.log.append('Rocket Launching', new Date());
  // setInterval(function () {
  //   info.log.append('hey there', new Date());
  // }, 1000);

  var degrees = 0;
  var alt;
  var interval = setInterval(function () {
    alt = Math.sin(degrees / 180 * Math.PI) * 80;
    info.chart.addData(alt + OFFSET, new Date());
    degrees += 1;
    if (degrees > 360) {
      info.log.append('Rocket Simulation Ended', new Date());
      clearInterval(interval);
    }
  }, 50);

  setTimeout(function () {
    info.log.append('Parachute Activated', new Date());
    info.chart.addMessage(alt + OFFSET, new Date(), 'Activated');
  }, 3000);

  setTimeout(function () {
    info.log.append('Parachute Deployed', new Date());
    info.chart.addMessage(alt + OFFSET, new Date(), 'Parachute');
  }, 7000);

}());
