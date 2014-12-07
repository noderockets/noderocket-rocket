/* global d3 */
// var chart = lineChart();

window.lineChart = lineChart;

function lineChart(el) {
  'use strict';

  var MAX_SECONDS = 10;
  var MAX_ALTITUDE = 100;
  var EVENT_COLOR = 'green';

  var m = { left: 30, right: 40, top: 30, bottom: 40 };

  var svg, w, h, xScale, yScale, xAxis, yAxis;
  resize();

  var startTime = 0;
  var baseAltitude = 0;
  function setAlt(alt) {
    baseAltitude = alt;
  }

  var animTime = 10;
  var color = 'steelblue';

  var line = d3.svg.line()
    .x(function (d) { return xScale(d.x - startTime); })
    .y(function (d) { return yScale(d.y - baseAltitude); });

  function init() {
    svg = d3.select(el).append('svg')
      .attr('class', 'graph')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('svg:g')
      .attr('transform', 'translate(' + m.left + ',' + m.top + ')');

    svg.append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + m.left + ',' + h + ')')
      .style('opacity', 0);

    svg.append('svg:text')
      .attr('class', 'x label')
      .attr('font-size', 14)
      .attr('font-family', 'serif')
      .attr('x', w / 2)
      .attr('y', h + m.top + 5)
      .attr('text-anchor', 'middle')
      .text('Time (s)');

    svg.append('svg:g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + m.left + ',0)')
      .style('opacity', 0);

    svg.append('svg:text')
      .attr('class', 'y label')
      .attr('font-size', 14)
      .attr('font-family', 'serif')
      .attr('transform', 'translate(-10,' + (h / 2) + ') rotate(270)')
      .attr('text-anchor', 'middle')
      .text('Altitude (m)');
  }

  function update(data, points) {
    data.sort(function (a, b) { return a.x - b.x; });
    startTime = rescale(data);

    // --- X Axis --------------------------------------------------------------

    svg.select('.x.axis').transition()
      .duration(animTime)
      .ease('linear')
      .style('opacity', 1)
      .attr('transform', 'translate(' + m.left + ',' + h + ')')
      .call(xAxis);

    // --- Y Axis --------------------------------------------------------------

    svg.select('.y.axis').transition()
      .duration(animTime)
      .ease('linear')
      .style('opacity', 1)
      .attr('transform', 'translate(' + m.left + ',0 )')
      .call(yAxis);

    // --- Line ----------------------------------------------------------------

    var svgLine = svg.selectAll('.myLine').data([data]);

    svgLine.enter()
      .append('svg:path')
      .attr('class', 'myLine')
      .style('fill', 'none')
      .style('opacity', 1)
      .style('stroke', color)
      .attr('stroke-width', 2)
      .attr('transform', 'translate(' + m.left + ',0)')
      .attr('d', line);

    svgLine.transition()
      .duration(animTime)
      .attr('transform', 'translate(' + m.left + ',0)')
      .attr('d', line);

    svgLine.exit().transition()
      .duration(animTime)
      .ease('linear')
      .style('opacity', 0)
      .remove();

    // --- Points of Interest --------------------------------------------------

    var dots = svg.selectAll('.myDots').data(points);

    dots.enter()
      .append('svg:circle')
      .attr('class', 'myDots')
      .style('fill', EVENT_COLOR)
      .style('opacity', 1)
      .attr('cy', function (d) { return yScale(d.y - baseAltitude); })
      .attr('cx', function (d) { return xScale(d.x - startTime) + m.left; })
      .attr('r', 5);

    dots.transition()
      .duration(animTime)
      .attr('cy', function (d) { return yScale(d.y - baseAltitude); })
      .attr('cx', function (d) { return xScale(d.x - startTime) + m.left; });

    dots.exit().transition()
      .duration(animTime)
      .ease('linear')
      .attr('r', 0)
      .remove();

    // --- Lines of Interest ---------------------------------------------------

    var lines = svg.selectAll('.myLines').data(points);

    lines.enter()
      .append('svg:line')
      .attr('class', 'myLines')
      .style('stroke', EVENT_COLOR)
      .style('opacity', 1)
      .attr('y1', 0)
      .attr('y2', h)
      .attr('x1', function (d) { return xScale(d.x - startTime) + m.left; })
      .attr('x2', function (d) { return xScale(d.x - startTime) + m.left; });

    lines.transition()
      .duration(animTime)
      .attr('y1', 0)
      .attr('y2', h)
      .attr('x1', function (d) { return xScale(d.x - startTime) + m.left; })
      .attr('x2', function (d) { return xScale(d.x - startTime) + m.left; });

    lines.exit().transition()
      .duration(animTime)
      .ease('linear')
      .attr('opacity', 0)
      .remove();

    // --- Text of Interest ----------------------------------------------------

    var text = svg.selectAll('.myText').data(points);

    text.enter()
      .append('svg:text')
      .attr('class', 'myText')
      .style('fill', EVENT_COLOR)
      .attr('transform', function (d) {
        var off = (yScale(d.y - baseAltitude) > h / 2) ? -10 : 10;
        return 'translate(' + (xScale(d.x - startTime) + m.left - 2) + ',' + (yScale(d.y - baseAltitude) + off) + ') rotate(270)';
      })
      .text(function (d) { return d.what; })
      .attr('font-size', 14)
      .attr('font-family', 'serif')
      .attr('text-anchor', function (d) {
        return (yScale(d.y - baseAltitude) > h / 2) ? 'start' : 'end';
      });

    text.transition()
      .duration(animTime)
      .attr('transform', function (d) {
        var off = (yScale(d.y - baseAltitude) > h / 2) ? -10 : 10;
        return 'translate(' + (xScale(d.x - startTime) + m.left - 2) + ',' + (yScale(d.y - baseAltitude) + off) + ') rotate(270)';
      })
      .attr('text-anchor', function (d) {
        return (yScale(d.y - baseAltitude) > h / 2) ? 'start' : 'end';
      });

    text.exit().transition()
      .duration(animTime)
      .ease('linear')
      .attr('opacity', 0)
      .remove();
  }

  function resize() {
    w = el.clientWidth - m.left - m.right;
    h = el.clientHeight - m.top - m.bottom;

    xScale = d3.scale.linear().range([0, w]);
    yScale = d3.scale.linear().range([h, 0]);

    xAxis = d3.svg.axis().scale(xScale).tickSize(2);
    yAxis = d3.svg.axis().scale(yScale).tickSize(2).orient('left');

    resizeAxes();
  }

  function resizeAxes() {
    if (!svg) return;
    var xLabel = svg.selectAll('.x.label');
    xLabel.transition()
      .duration(animTime)
      .attr('x', w / 2)
      .attr('y', h + m.top + 5);

    var yLabel = svg.selectAll('.y.label');
    yLabel.transition()
      .duration(animTime)
      .attr('transform', 'translate(-10,' + (h / 2) + ') rotate(270)');
  }

  function rescale(data) {
    if (data && data.length > 0) {
      var xExtremes = d3.extent(data, function (d) { return d.x; });
      var maxX = Math.max(xExtremes[1] - xExtremes[0], MAX_SECONDS);
      xScale.domain([0, maxX]);

      var yExtremes = d3.extent(data, function (d) { return d.y; });
      var maxY = Math.max(yExtremes[1] - baseAltitude, MAX_ALTITUDE);
      var minY = Math.min(yExtremes[0] - baseAltitude, 0);
      yScale.domain([minY, maxY]);

      return xExtremes[0];
    } else {
      xScale.domain([0, MAX_SECONDS]);
      yScale.domain([0, MAX_ALTITUDE]);
      return 0;
    }
  }

  return {
    init: init,
    update: update,
    resize: resize,
    setAlt: setAlt
  };
}
