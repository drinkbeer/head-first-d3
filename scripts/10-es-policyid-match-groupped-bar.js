define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {
    "use strict";
    var client = new elasticsearch.Client({
        host: 'search-log-project-test-wujipdfohyl4gl56zcwp3y3btu.us-west-1.es.amazonaws.com',
//        log: 'trace'
    });
    client.search({
        index: '',
        size: 5,
        body: {
            // Begin query.
//            query: {
//                // Boolean query for matching and excluding items.
//                bool: {
//                    must: { match: { "description": "TOUCHDOWN" }},
//                    must_not: { match: { "qtr": 5 }}
//                }
//            },
            // Aggregate on the results
            "aggs": {
                "policies": { 
                    "nested": {
                        "path": "policies"
                    },
                    "aggs": {
                        "by_policy_id" : {
                            "terms" : {"field" : "policies.POLICY_ID"},
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
//        console.log(resp);
        // D3 code goes here.
        var data = resp.aggregations.policies.by_policy_id.buckets;
        console.log(data)
        // d3 groupped bar chart
        var n = 10, // number of samples
            m = 3; // number of series

//        var data = d3.range(n).map(function() { return d3.range(m).map(Math.random); });
//        console.log(data);
        var margin = {
            top: 20, 
            right: 30, 
            bottom: 30, 
            left: 40
        },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        //scale of x - total policies
        var x0 = d3.scale.ordinal()
            .domain(data.map(function(entry){
//                console.log(entry)
                return entry.key;
            }))
            .rangeBands([0, width], 0.2);
        //scale of x - each policy
        var x1 = d3.scale.ordinal()
            .domain(d3.range(3))
            .rangeBands([0, x0.rangeBand()]);
        var y = d3.scale.linear()
            .domain([0, d3.max(data.map(function(entry){
                return entry.doc_count;
            }))])
            .range([height, 0]);
        var colorScale = d3.scale.ordinal()
            .domain(["yes", "no", "maybe"])
            .range(["green", "red", "blue"]);
        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
        var yGridlines = d3.svg.axis()
            .scale(y)
            .tickSize(-width, 0, 0)
            .tickFormat("")
            .orient("left");
        //create chart
        var svg = d3.select("body").append("svg")
                    .attr("id", "chart")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);
        var chart = svg.append("svg:g")
                    .classed("display", true)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
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
            //add yGridlines
            this.append("g")
                .call(yGridlines)
                .classed("gridline", true)
                .attr("transform", "translate(0,0)")
            //add axis
            this.append("g")
                .attr("class", "y axis")
                .call(yAxis);
            this.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
            //add rects
            this.selectAll(".bar")
                .data(data)
                .enter().append("g")
                    .classed("bar-box", true)
                    .attr("transform", function(d, i) { return "translate(" + x0(d.key) + ",0)"; })
                    .selectAll("rect")
                        .classed("bar", true)
                        .data(function(d) { return d.match_info.buckets; })
                        .enter().append("rect")
                            .style("fill", function(d, i) { return colorScale(d.key); })
                            .attr("x", function(d, i) { return x1(i); })
                            .attr("y", function(d) { return y(d.doc_count); })
                            .attr("width", x1.rangeBand())
                            .attr("height", function(d){ return height - y(d.doc_count);});
            //add color legend
            legend = this.append("g")
                .attr("class","legend")
                .attr("transform","translate(" + (width - 100) + ",30)")
                .style("font-size","12px")
                .call(d3.legend);
            setTimeout(function() { 
                legend
                .style("font-size","20px")
                .attr("data-style-padding",10)
                .call(d3.legend)
            },1000)
        }
        plot.call(chart, {
            data: resp,
            axis: {
                x: xAxis,
                y: yAxis
            }
        })


    });
});