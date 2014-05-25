/* global lineChart */

window.rocketInfo = rocketInfo;

function rocketInfo(chartEl, logEl) {
  'use strict';

  // --- Driver Code -----------------------------------------------------------

  // Chart
  var data, points, startTime;
  var chart = lineChart(chartEl);
  chart.init();
  resetChart();
  window.addEventListener('resize', debounce(onResize, 100));

  return {
    chart: {
      addData: addData,
      addMessage: addMessage,
      reset: resetChart,
      baseAlt: chart.setAlt
    },
    log: {
      append: appendLog,
      clear: clearLogs
    }
  };

  // --- Log Functions ---------------------------------------------------------

  function appendLog(msg, time) {
    var log = '<div><b>' + getTime(time) + '</b><span>' + msg + '</span></div>';
    logEl.innerHTML = log + logEl.innerHTML;
  }

  function clearLogs() {
    logEl.innerHTML = '';
  }

  // --- Graph Functions -------------------------------------------------------

  function resetChart() {
    data = [];
    points = [];
    startTime = null;
    chart.update(data, points);
  }

  function addData(alt, time) {
    var obj = {
      x: time / 1000,
      y: alt
    };
    data.push(obj);
    chart.update(data, points);
  }

  function addMessage(alt, time, msg) {
    if (msg === 'Apogee') {
      for (var i = 0; i < points.length; ++i) {
        if (points[i].what === 'Apogee') {
          points.splice(i, 1);
          break;
        }
      }
    }

    var obj = {
      x: time / 1000,
      y: alt,
      what: msg
    };
    points.push(obj);
    chart.update(data, points);
  }

  function onResize() {
    chart.resize();
    chart.update(data, points);
  }

  // --- Utility Functions -----------------------------------------------------

  function debounce(fn, time) {
    var flag;
    return function() {
      if (flag) clearTimeout(flag);
      flag = setTimeout(function () {
        fn();
        clearTimeout(flag);
      }, time);
    };
  }

  function getTime(time) {
    var hours = time.getHours() % 12 || 12;
    var minutes = '' + time.getMinutes();
    if (minutes.length < 2) minutes = '0' + minutes;
    var seconds = '' + time.getSeconds();
    if (seconds.length < 2) seconds = '0' + seconds;
    return hours + ':' + minutes + ' ' + seconds;
  }
}
