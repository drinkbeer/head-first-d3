define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {
    "use strict";
    var client = new elasticsearch.Client({
        host: 'search-log-project-test-wujipdfohyl4gl56zcwp3y3btu.us-west-1.es.amazonaws.com',
//        log: 'trace'
    });
    client.search({
        index: 'logstash-sable-2016.07.12',
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
            .domain(d3.range(m))
            .rangeBands([0, x0.rangeBand()]);
        var y = d3.scale.linear()
            .domain([0, 20])
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
        }
        plot.call(chart, {
            data: resp,
            axis: {
                x: xAxis,
                y: yAxis
            }
        })

        //add rects
        chart.selectAll(".bar")
                .data(data)
                .enter().append("g")
                    .classed("bar-box", true)
                    .attr("transform", function(d, i) { return "translate(" + x0(d.key) + ",0)"; })
                    .selectAll("rect")
                        .classed("bar", true)
                        .data(function(d) { return d.match_info.buckets; })
                        .enter().append("rect")
                            .style("fill", function(d, i) { console.log(d);return colorScale(d.key); })
                            .attr("x", function(d, i) { return x1(i); })
                            .attr("y", function(d) { return y(d.doc_count); })
                            .attr("width", x1.rangeBand())
                            .attr("height", function(d){ return height - y(d.doc_count);});
    });
});