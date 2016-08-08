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
                            "last_one_days": {
                                "range": {
                                    "loggingTime": {
                                        "from": "now-1d/d"
                                    }
                                }
                            },
                            "last_three_days": {
                                "range": {
                                    "loggingTime": {
                                        "from": "now-3d/d"
                                    }
                                }
                            },
                            "last_seven_days": {
                                "range": {
                                    "loggingTime": {
                                        "from": "now-7d/d"
                                    }
                                }
                            },
                            "all_days": {
                                "match_all": {}
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
                                    "terms" : {"field" : "policies.match"}
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
        var data = resp.aggregations.date_range_policies_aggs.buckets.all_days.policies.match_info.buckets;
        var last_seven_days = resp.aggregations.date_range_policies_aggs.buckets.last_seven_days.policies.match_info.buckets;
        var last_three_days = resp.aggregations.date_range_policies_aggs.buckets.last_three_days.policies.match_info.buckets;
        var last_one_days = resp.aggregations.date_range_policies_aggs.buckets.last_one_days.policies.match_info.buckets;
        // d3 donut chart
        var w = 600;
        var h = 400;
        var margin = {
            top: 60,
            right: 60,
            bottom: 30,
            left: 100
        };
        var width = w - margin.left - margin.right;
        var height = h - margin.top - margin.bottom;

        var r = Math.min(width, height) / 2;
        var labelr = r + 30; // radius for label anchor
        //scaling of color
        var color = d3.scale.category20();
        var colorScale = d3.scale.ordinal()
            .domain(["yes", "no", "maybe"])
            .range(["green", "red", "blue"]);
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

        //create color legend
        d3.legend = function(g) {
          g.each(function() {
            var g= d3.select(this),
                items = {},
                svg = d3.select(g.property("nearestViewportElement")),
                legendPadding = g.attr("data-style-padding") || 5,
                lb = g.selectAll(".legend-box").data([true]),
                li = g.selectAll(".legend-items").data([true])

            lb.enter().append("rect").classed("legend-box",true)
            li.enter().append("g").classed("legend-items",true)

            svg.selectAll("[data-legend]").each(function() {
                var self = d3.select(this)
                items[self.attr("data-legend")] = {
                  pos : self.attr("data-legend-pos") || this.getBBox().y,
                  color : self.attr("data-legend-color") != undefined ? self.attr("data-legend-color") : self.style("fill") != 'none' ? self.style("fill") : self.style("stroke") 
                }
              })

            items = d3.entries(items).sort(function(a,b) { return a.value.pos-b.value.pos})

            li.selectAll("text")
                .data(["YES", "NO", "MAYBE"])
                .call(function(d) { d.enter().append("text")})
                .call(function(d) { d.exit().remove()})
                .attr("y",function(d,i) { return i+"em"})
                .attr("x","1em")
                .text(function(d) { return d})

            li.selectAll("circle")
                .data(["green", "red", "blue"])
                .call(function(d) { d.enter().append("circle")})
                .call(function(d) { d.exit().remove()})
                .attr("cy",function(d,i) { return i-0.25+"em"})
                .attr("cx",0)
                .attr("r","0.4em")
                .style("fill",function(d) { return d })  

            // Reposition and resize the box
            var lbbox = li[0][0].getBBox()  
            lb.attr("x",(lbbox.x-legendPadding))
                .attr("y",(lbbox.y-legendPadding))
                .attr("height",(lbbox.height+2*legendPadding))
                .attr("width",(lbbox.width+2*legendPadding))
          })
          return g
        }
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
                    return "Policy Match Statistics Diagram (" + mm + "/" + dd + "/" + yyyy + "-now)"
                });
            var arcs = this.selectAll(".arc")
                .data(donut.value(function(d) { return d.doc_count }))
                .enter().append("g")
                .classed("arc", true)
                .attr("transform", "translate(" + (params.r + 30) + "," + params.r + ")")

            arcs.append("svg:path")
                .attr("fill", function(d, i) { return colorScale(d.data.key); })
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
            arcs.on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                var total = d3.sum(params.data.map(function(d) { return d.doc_count; }));
                var percent = Math.round(1000 * d.data.doc_count / total) / 10;
                div.html("Match:"+(d.data.key)+"<br>"+(d.data.doc_count)+"<br>"+percent+"%");
            });
            arcs.on("mouseout", function(d){
                div.style("display", "none");
            });
            
            //attach color legend
            legend = this.append("g")
                .attr("class","legend")
                .attr("transform","translate(" + (width - 60) + ",30)")
                .style("font-size","12px")
                .call(d3.legend);
            setTimeout(function() {
                legend
                .style("font-size","20px")
                .attr("data-style-padding",10)
                .call(d3.legend)
            },1000);

        }
        //call main function
        plot.call(chart, {
            data: data,
            r: r,
            labelr: labelr
        });

    });
});