define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {
    "use strict";
    var client = new elasticsearch.Client({
        host: 'search-log-project-test-wujipdfohyl4gl56zcwp3y3btu.us-west-1.es.amazonaws.com'
        //log: 'trace'
    });
    client.search({
        index: '',
        size: 5,
        body: {
            // Begin query.
            // Aggregate on the results
            "aggs": {
                "policies": {
                    "nested": {
                        "path": "policies"
                    },
                    "aggs": {
                        "match_info" : {
                            "terms" : {"field" : "policies.match"}
                        }
                    }
                }
            }
            // End query.
        }
    }).then(function (resp) {
        // D3 code goes here.
        var data = resp.aggregations.policies.match_info.buckets;
        //console.log(data)
        // d3 donut chart
        var w = 700;
        var h = 400;
        var margin = {
            top: 60,
            right: 120,
            bottom: 30,
            left: 100
        };
        var width = w - margin.left - margin.right;
        var height = h - margin.top - margin.bottom;

        var r = Math.min(width, height) / 2;
        var labelr = r + 30; // radius for label anchor
        var color = d3.scale.category20();
        var donut = d3.layout.pie();
        var arc = d3.svg.arc().innerRadius(r * .6).outerRadius(r);

        var svg = d3.select("body").append("svg")
            .attr("id", "chart")
            .attr("width", w)
            .attr("height", h);
        var chart = svg.append("g")
            .classed("display", true)
//            .attr("width", w)
//            .attr("height", h)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

        function plot(params){
            this.data([params.data])
            //console.log(params.data)
            var arcs = this.selectAll(".arc")
                .data(donut.value(function(d) { return d.doc_count }))
                .enter().append("g")
                .classed("arc", true)
                .attr("transform", "translate(" + (params.r + 30) + "," + params.r + ")")

            arcs.append("svg:path")
                .attr("fill", function(d, i) { return color(i); })
                .attr("d", arc);

            arcs.append("svg:text")
                .attr("transform", function(d) {
                    var c = arc.centroid(d),
                        x = c[0],
                        y = c[1],
                        // pythagorean theorem for hypotenuse
                        h = Math.sqrt(x*x + y*y);
                    return "translate(" + (x/h * params.labelr) +  ',' + (y/h * params.labelr) +  ")"; 
                })
                .attr("dy", ".35em")
                .attr("text-anchor", function(d) {
                    // are we past the center?
                    return (d.endAngle + d.startAngle)/2 > Math.PI ? "end" : "start";
                })
                .text(function(d, i) { return d.value.toFixed(0); });

  var legend = d3.select("body").append("svg")
      .attr("class", "legend")
      .attr("width", radius * 2)
      .attr("height", radius * 2)
    .selectAll("g")
      .data(color.domain().slice().reverse())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) { return d; });
            
        }
        plot.call(chart, {
            data: data,
            r : r,
            labelr: labelr
        });

    });
});