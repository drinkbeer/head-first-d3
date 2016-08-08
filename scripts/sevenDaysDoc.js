define(['/ext-scripts/d3.v3.js', '/ext-scripts/elasticsearch.js'], function (d3, elasticsearch) {
    "use strict";
    var client = new elasticsearch.Client({
        host: 'search-log-project-test-wujipdfohyl4gl56zcwp3y3btu.us-west-1.es.amazonaws.com'
    });
    client.search({
        index: '',
        size: 5,
        body: {
            // Begin query. Aggregate on the results
            "aggs": {
                "docs_over_time" : {
                    "date_histogram" : {
                        "field" : "loggingTime", 
                        "interval": "day"
                    }
                }
            }
            // End query.
        }
    }).then(function (resp) {
        // D3 code goes here.
        var data = resp.aggregations.docs_over_time.buckets;
        data = data.slice(Math.max(data.length - 7, 1))
        data.forEach(function(d){ d.key_as_string = d.key_as_string.substring(0, 10) });
        // d3 donut chart
        var w = 500;
        var h = 500;
        var margin = {
            top: 100,
            right: 50,
            bottom: 30,
            left: 50
        };
        var width = w - margin.left - margin.right;
        var height = h - margin.top - margin.bottom;
        var legendRectSize = 18;
        var legendSpacing = 4;

        var r = Math.min(width, height) / 2;
        //scaling of color
        var color = d3.scale.category20();
        var donut = d3.layout.pie().value(function(d) { return d.doc_count; });
        var arc = d3.svg.arc().innerRadius(r * .6).outerRadius(r);
        
        //create SVG, chart component and tooltip component
        var svg = d3.select("#container").append("svg")
            .attr("id", "chart")
            .attr("width", w)
            .attr("height", h);
        var chart = svg.append("g")
            .classed("display", true)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
        var div = d3.select("body").append("div").attr("class", "toolTip");
        
        //remove loading spinner
        d3.select("#loading").classed("loading", false)

        //main function
        function plot(params){
            //transform raw data
            params.data.forEach(function(d) {
                d.doc_count = +d.doc_count;
                d.enabled = true;
            });
            
            this.append("g")
                .append("text")
                .attr("x", (width / 2))
                .attr("y", 0)
                .classed("chart-header", true)
                .style("text-anchor", "middle")
                .attr("transform", "translate(0," + -30 + ")")
                .text(function(d){
                    var d = new Date();
                    d.setDate(d.getDate() - 7);
                    var dd = d.getDate();
                    var mm = d.getMonth()+1; //January is 0!
                    var yyyy = d.getFullYear();
                    if(dd<10) { dd='0'+dd } 
                    if(mm<10) { mm='0'+mm } 
                    return "Seven Days Log Statistics Diagram(" + mm + "/" + dd + "/" + yyyy + "-now)"
                });
            
            //create path (the arc)
            var path = chart.selectAll('path')
                .data(donut(params.data))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr("transform", "translate(" + r + "," + r + ")")
                .attr('fill', function(d, i) {
                    return color(d.data.key_as_string);
                })
                .each(function(d) { this._current = d; });

            //attach path
            path.transition().duration(1000)
                .attrTween("d", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                })
            path.on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                var total = d3.sum(params.data.map(function(d) { return (d.enabled) ? d.doc_count : 0; }));
                var percent = Math.round(1000 * d.data.doc_count / total) / 10;
                div.html((d.data.key_as_string)+"<br>"+(d.data.doc_count)+"<br>"+percent+"%");
            });
            path.on("mouseout", function(d){
                div.style("display", "none");
            });

            //may remove later
            //path.exit()
            //    .remove();

            //create legend
            var legend = chart.selectAll('.legend')
                .data(color.domain())
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function(d, i) {
                    var height = legendRectSize + legendSpacing;
                    var offset =  height * color.domain().length / 2;
                    var horz = -2 * legendRectSize;
                    var vert = i * height - offset;
                    return 'translate(' + (r + horz) + ',' + (r + vert) + ')';
                });

            // attach legend
            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', color)
                .style('stroke', color)
                .on('click', function(label) {
                    var rect = d3.select(this);
                    var enabled = true;
                    var totalEnabled = d3.sum(params.data.map(function(d) {
                        return (d.enabled) ? 1 : 0;
                    }));

                    if (rect.attr('class') === 'disabled') {
                        rect.attr('class', '');
                    } else {
                        if (totalEnabled < 2) return;
                        rect.attr('class', 'disabled');
                        enabled = false;
                    }

                    donut.value(function(d) {
                        if (d.key_as_string === label) d.enabled = enabled;
                        return (d.enabled) ? d.doc_count : 0;
                    });

                    path = path.data(donut(params.data));
                    path.transition()
                        .duration(750)
                        .attrTween('d', function(d) {
                            var interpolate = d3.interpolate(this._current, d);
                            this._current = interpolate(0);
                            return function(t) {
                                return arc(interpolate(t));
                            };
                        });
                });
                legend.append('text')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing)
                    .text(function(d) { return d; });
        }
        //call main function
        plot.call(chart, {
            data: data,
            r: r
        });
        
    });
});