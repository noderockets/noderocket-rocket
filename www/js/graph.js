var m = { left: 30, right: 40, top: 30, bottom: 40 };
var svg, w, h, xScale, yScale, xAxis, yAxis;

function lineChart(el) {
  var svg = d3.select(el).append('svg')
    .attr('class', 'graph')
    .attr('width', '100%')
    .attr('height', '100%')
    .append('svg:g')
    .attr('transform', 'translate(' + m.left + ',' + m.top + ')');

  svg.append('svg:g')
    .attr('class', 'xaxis')
    .attr('transform', 'translate(' + m.left + ',' + 400 + ')')
    .style('opacity', 0);

  svg.append('svg:text')
    .attr('class', 'xlabel')
    .attr('font-size', 14)
    .attr('font-family', 'serif')
    .attr('x', w / 2)
    .attr('y', h + m.top + 5)
    .attr('text-anchor', 'middle')
    .text('Time (s)');

  svg.append('svg:g')
    .attr('class', 'yaxis')
    .attr('transform', 'translate(' + m.left + ',0)')
    .style('opacity', 0);

  svg.append('svg:text')
    .attr('class', 'ylabel')
    .attr('font-size', 14)
    .attr('font-family', 'serif')
    .attr('transform', 'translate(-10,' + (400 / 2) + ') rotate(270)')
    .attr('text-anchor', 'middle')
    .text('Altitude (m)');
}
