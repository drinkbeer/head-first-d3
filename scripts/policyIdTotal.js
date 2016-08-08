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
            "size" : 0,
            "aggs": {
                "date_range_policies_aggs": {
                    "filters": {
                        "filters": {
                            "last_seven_days": {
                                "range": {
                                    "loggingTime": {
                                        "from": "now-7d/d"
                                    }
                                }
                            }
                        }
                    },
                    "aggs": {
                        "policies": { 
                            "nested": {
                                "path": "policies"
                            },
                            "aggs": {
                                "match_info" : {
                                    "terms" : {"field" : "policies.POLICY_ID", "size" : 11}
                                }
                            }
                        }
                    }
                }
            }
            // End query.
        }
    }).then(function (resp) {
        // D3 code goes here.
        var data =  resp.aggregations.date_range_policies_aggs.buckets.last_seven_days.policies.match_info.buckets;
        last_seven_days.shift();
        // d3 donut chart
        var w = 600;
        var h = 500;
        var margin = {
            top: 60,
            right: 60,
            bottom: 30,
            left: 60
        };
        var width = w - margin.left - margin.right;
        var height = h - margin.top - margin.bottom;
        var r = Math.min(width, height) / 2 - 20;
        var labelr = r + 30; // radius for label anchor
        //scaling of color
        var color = d3.scale.category20();
        var donut = d3.layout.pie();
        var arc = d3.svg.arc().innerRadius(r * .6).outerRadius(r);

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
        
        function plot(params){
            //bind data to component
            this.data([params.data])
            this.append("g")
                .append("text")
                .attr("x", (width / 2))
                .attr("y", 0)
                .classed("chart-header", true)
                .style("text-anchor", "middle")
                .attr("transform", "translate(0," + -24 + ")")
                .text(function(d){
                    var d = new Date();
                    d.setDate(d.getDate() - 7);
                    var dd = d.getDate();
                    var mm = d.getMonth()+1; //January is 0!
                    var yyyy = d.getFullYear();
                    if(dd<10) { dd='0'+dd } 
                    if(mm<10) { mm='0'+mm } 
                    return "Total Policy ID Statistics Diagram (" + mm + "/" + dd + "/" + yyyy + "-now)"
                });
            var arcs = this.selectAll(".arc")
                .data(donut.value(function(d) { return d.doc_count }))
                .enter().append("g")
                .classed("arc", true)
                .attr("transform", "translate(" + width / 2 + "," + (height / 2 +5) + ")")

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
                    return (d.endAngle + d.startAngle)/2 > Math.PI ? "end" : "start";
                })
                .text(function(d, i) { return d.value.toFixed(0); });
            
            arcs.on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                var total = d3.sum(params.data.map(function(d) { return d.doc_count; }));
                var percent = Math.round(1000 * d.data.doc_count / total) / 10;
                div.html("ID:"+(d.data.key)+"<br>"+(d.data.doc_count)+"<br>"+percent+"%");
            });
            arcs.on("mouseout", function(d){
                div.style("display", "none");
            });
        }
        //call plot function
        plot.call(chart, {
            data: data,
            r: r,
            labelr: labelr
        });

    });
});