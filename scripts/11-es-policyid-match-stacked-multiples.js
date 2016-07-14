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
        console.log(resp);
        // D3 code goes here.
        var data = resp.aggregations.policies.by_policy_id.buckets;
        console.log(data)
        // d3 groupped bar chart
        var n = 10, // number of samples
            m = 3; // number of series

        var data = d3.range(m).map(function() { return d3.range(n).map(Math.random); });
        console.log(data);
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
            .domain(d3.range(n))
            .rangeBands([0, width], .2);
        //scale of x - each policy
        var x1 = d3.scale.ordinal()
            .domain(d3.range(m))
            .rangeBands([0, x0.rangeBand()]);
        var y = d3.scale.linear()
            .domain([0, 1])
            .range([height, 0]);
        var colorScale = d3.scale.category10();
        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(y)
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
            //add axis
//            this.append("g")
//                .attr("class", "y axis")
//                .call(yAxis);
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
        chart.append("g").selectAll("g")
                .data(data)
                .enter().append("g")
                    .style("fill", function(d, i) { return colorScale(i); })
                    .attr("transform", function(d, i) { return "translate(" + x1(i) + ",0)"; })
                    .selectAll("rect")
                        .data(function(d) { return d; })
                        .enter().append("rect")
                            .attr("width", x1.rangeBand())
                            .attr("height", y)
                            .attr("x", function(d, i) { return x0(i); })
                            .attr("y", function(d) { return height - y(d); });
    });
});