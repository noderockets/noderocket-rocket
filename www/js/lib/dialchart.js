//
// DialChart
//
NBXDialChart = function() {

  var w = 256,
    h = 256,
    m = [ 0, 0, 0, 0 ], // top right bottom left
    domain = [0, 1],
    range = [-135, 135],
    minorTicks = 4,
    minorMark = 'line'

  dial = [ 1.00, 0.95, 0.92, 0.85 ],
    scale = [ 0.71, 0.75, 0.76 ],
    needle = [ 0.83, 0.05 ],
    pivot = [ 0.10, 0.05 ];

  function dialchart(g) {
    g.each(function(d, i) {

      var wm = w - m[1] - m[3],
        hm = h - m[0] - m[2],
        a = d3.scale.linear().domain(domain).range(range);

      var r = Math.min(wm / 2, hm / 2);

      var g = d3.select(this).select('g');
      if (g.empty()) {

        g = d3.select(this).append('svg:g')
          .attr('transform', 'translate(' + (m[3] + wm / 2) + ',' + (m[0] + hm / 2) + ')');

        createDefs(g.append('svg:defs'));

        // face

        g.append('svg:circle')
          .attr('r', r * dial[0])
          .style('fill', 'url(#outerGradient)')
          .attr('filter', 'url(#dropShadow)');

        g.append('svg:circle')
          .attr('r', r * dial[1])
          .style('fill', 'url(#innerGradient)');

        g.append('svg:circle')
          .attr('r', r * dial[2])
          .style('fill', 'url(#faceGradient)');

        // scale

        var major = a.ticks(10);
        var minor = a.ticks(10 * minorTicks).filter(function(d) { return major.indexOf(d) == -1; });

        g.selectAll('text.label')
          .data(major)
          .enter().append('svg:text')
          .attr('class', 'label')
          .attr('x', function(d) { return Math.cos( (-90 + a(d)) / 180 * Math.PI) * r * scale[1]; })
          .attr('y', function(d) { return Math.sin( (-90 + a(d)) / 180 * Math.PI) * r * scale[1]; })
          .attr('text-anchor', 'middle')
          .attr('dy', '0.5em')
          .text(a.tickFormat());

        if (minorMark == 'circle') {
          g.selectAll('circle.label')
            .data(minor)
            .enter().append('svg:circle')
            .attr('class', 'label')
            .attr('cx', function(d) { return Math.cos( (-90 + a(d)) / 180 * Math.PI) * (r * scale[1]); })
            .attr('cy', function(d) { return Math.sin( (-90 + a(d)) / 180 * Math.PI) * (r * scale[1]); })
            .attr('r', 2);
        }

        if (minorMark == 'line') {
          g.selectAll('line.label')
            .data(minor)
            .enter().append('svg:line')
            .attr('class', 'label')
            .attr('x1', function(d) { return Math.cos( (-90 + a(d)) / 180 * Math.PI) * (r * scale[0]); })
            .attr('y1', function(d) { return Math.sin( (-90 + a(d)) / 180 * Math.PI) * (r * scale[0]); })
            .attr('x2', function(d) { return Math.cos( (-90 + a(d)) / 180 * Math.PI) * (r * scale[2]); })
            .attr('y2', function(d) { return Math.sin( (-90 + a(d)) / 180 * Math.PI) * (r * scale[2]); });
        }

        var rdial3 = r * dial[3];
        g.append('svg:path')
          .attr('class', 'dial-glare')
          .attr('d', 'M ' + (-rdial3) + ',0 A' + rdial3 + ',' + rdial3 + ' 0 0,1 ' + rdial3 + ',0 A' + (rdial3 * 5) + ',' + (rdial3 * 5) + ' 0 0,0 ' + (-rdial3) + ',0')
          .style('fill', 'url(#glareGradient)');

        // needle

        var n = g.append('svg:g')
          .attr('class', 'needle')
          .attr('filter', 'url(#dropShadow)')
          .attr('transform', function(d) { return 'rotate(' + a(d) + ')'; });

        n.append('svg:path')
          .attr('d', 'M ' + (-r * needle[1]) + ',0 L0,' + (-r * needle[0])+ ' L' + r * needle[1] + ',0');

        n.append('svg:circle')
          .attr('r', r * pivot[0])
          .style('fill', 'url(#outerGradient)');

        n.append('svg:circle')
          .attr('r', r * pivot[1])
          .style('fill', 'url(#innerGradient)');

      } else {

        g.select('g.needle')
          .transition().duration(1000).ease('elastic')
          .attr('transform', function(d) { return 'rotate(' + a(d) + ')'; });

      }

    });
    d3.timer.flush();
  }

  function createDefs(defs) {

    var outerGradient = defs.append('svg:linearGradient')
      .attr('id', 'outerGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')
      .attr('spreadMethod', 'pad');

    outerGradient.selectAll('stop')
      .data([{ o: '0%', c: '#ffffff' }, { o: '100%', c: '#d0d0d0' }])
      .enter().append('svg:stop')
      .attr('offset', function(d) { return d.o; })
      .attr('stop-color', function(d) { return d.c; })
      .attr('stop-opacity', '1');

    var innerGradient = defs.append('svg:linearGradient')
      .attr('id', 'innerGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')
      .attr('spreadMethod', 'pad');

    innerGradient.selectAll('stop')
      .data([{ o: '0%', c: '#d0d0d0' }, { o: '100%', c: '#ffffff' }])
      .enter().append('svg:stop')
      .attr('offset', function(d) { return d.o; })
      .attr('stop-color', function(d) { return d.c; })
      .attr('stop-opacity', '1');

    var faceGradient = defs.append('svg:linearGradient')
      .attr('id', 'faceGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')
      .attr('spreadMethod', 'pad');

    faceGradient.selectAll('stop')
      .data([{ o: '0%', c: '#000000' }, { o: '100%', c: '#494949' }])
      .enter().append('svg:stop')
      .attr('offset', function(d) { return d.o; })
      .attr('stop-color', function(d) { return d.c; })
      .attr('stop-opacity', '1');

    var glareGradient = defs.append('svg:linearGradient')
      .attr('id', 'glareGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')
      .attr('spreadMethod', 'pad');

    glareGradient.selectAll('stop')
      .data([{ o: '0%', c: '#ffffff', op: 0.60 }, { o: '100%', c: '#ffffff', op: 0.00 }])
      .enter().append('svg:stop')
      .attr('offset', function(d) { return d.o; })
      .attr('stop-color', function(d) { return d.c; })
      .attr('stop-opacity', function(d) { return d.op; });

    var dropShadowFilter = defs.append('svg:filter')
      .attr('id', 'dropShadow');
    dropShadowFilter.append('svg:feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);
    dropShadowFilter.append('svg:feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offsetblur');
    var feMerge = dropShadowFilter.append('svg:feMerge');
    feMerge.append('svg:feMergeNode');
    feMerge.append('svg:feMergeNode')
      .attr('in', "SourceGraphic");

  }

  dialchart.width = function(d) {
    if (!arguments.length) return w;
    w = d;
    return dialchart;
  };

  dialchart.height = function(d) {
    if (!arguments.length) return h;
    h = d;
    return dialchart;
  };

  dialchart.margin = function(d) {
    if (!arguments.length) return m;
    m = d;
    return dialchart;
  };

  dialchart.domain = function(d) {
    if (!arguments.length) return domain;
    domain = d;
    return dialchart;
  };

  dialchart.range = function(d) {
    if (!arguments.length) return range;
    range = d;
    return dialchart;
  };

  dialchart.scale = function(d) {
    if (!arguments.length) return scale;
    scale = d;
    return dialchart;
  };

  dialchart.minorTicks = function(d) {
    if (!arguments.length) return minorTicks;
    minorTicks = d;
    return dialchart;
  };

  dialchart.minorMark = function(d) {
    if (!arguments.length) return minorMark;
    minorMark = d;
    return dialchart;
  };

  return dialchart;

};