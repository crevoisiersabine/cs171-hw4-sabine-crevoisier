/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 800 - margin.left - margin.right;
var height = 400 - margin.bottom - margin.top;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:350,
    height:200
})
var barPadding = 1;
var w = 350;
var h = 200;
//Make a scale so the bar plot doesn't fall off the visualisation space
var scaleDetail = d3.scale.ordinal()
        .rangeRoundBands([0, w-100], 0.5);
var scaleDetail_y = d3.scale.linear()
        .range([h, 30]) //the 30 correponds to a vertical margin for the detail graph

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]).scale(width);//.precision(.1);
var path = d3.geo.path().projection(projection);
var centered;

var dataSet = {};
var month_data = {}
var detail_data = {}

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<strong>Station:</strong> <span style='color:steelblue'>" + d.state + "</span>";
  });

svg.call(tip);

function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){ //load the stations data
        d3.json("../data/reducedMonthStationHour2003_2004-new.json", function(error,json){ //load the luminosity data
            completeDataSet = json['Nov']; //Choose a particular month for the visualisation
            //create a dictionary month data with station as a key and sum of luminosity for the month as a value
            for (station_name in completeDataSet){
                month_data[station_name] = completeDataSet[station_name].sum
                detail_data[station_name] = completeDataSet[station_name].hours
            }

            //create a dataset stations with USAF, lat, long, state information
            var stations = [];
            data.forEach(function(d){
                station = {USAF: "", latitude: 0, longitude: 0, state: ""};
                station.USAF = d['USAF'];
                station.latitude = parseFloat(String(d['NSRDB_LAT (dd)']));
                station.longitude = parseFloat(String(d['NSRDB_LON(dd)']));
                station.state = d['STATION'];
                if (projection([station.longitude, station.latitude]) != null){ //If the point can be plotted on the map, add it to the dataset
                    stations.push(station);
                }
            })
            //Add attribute radius to the dataset according to the luminosity sum from month_data dataset
            stations.forEach(function(d){
                for (has_data in month_data){
                    if (d.USAF == has_data && parseFloat(String(month_data[has_data])) != 0.0){
                        d['radius'] = Math.pow(1.25, Math.pow(parseFloat(String(month_data[has_data])), 1/7));
                    }
                    else{
                        if(d.radius == undefined){ //only assign a radius if the datapoint hasn't already got one to avoid overwriting
                            d['radius'] = 2;
                        }
                    }
                }
            })
            // console.log(stations)

            // DETAIL VISUALISATION
            var all_values = [] //create an array of array of all values to determine min and max for yScale
            for (all_station in detail_data){
                var array = $.map(detail_data[all_station], function(value, index) { //Select a station to start with
                    if(value == 0 ) return [value];
                    else return [Math.log(value)];
                });
                all_values.push(array);
            }
            var array = all_values[0] //select first element to start with before user makes a click selection
            //Create x-axis
            var xAxis = d3.svg.axis()
                  .scale(scaleDetail)
                  .orient("bottom");
            scaleDetail.domain(d3.range(array.length)) //update the domain based on the data
            detailVis.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(100," + (h - 20) + ")")
                .call(xAxis);

            //Create y-axis
            var yAxis = d3.svg.axis()
                  .scale(scaleDetail_y)
                  .orient("left");
            scaleDetail_y.domain([0, Math.exp(d3.max(all_values, function(c, i) { return d3.max(all_values[i]); }))])
            detailVis.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + 100 + "," + (-20) + ")")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(90)")
                .attr("y", -20)
                .attr("x", (h / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Luminosity");

            //Create a title for the visualisation
            detailVis.append("text").attr("class", "title")
                    .attr("y", 10)
                    .attr("x", w/2)

            // console.log(array)
            detailVis.append("g")
                .attr("transform", "translate(100," + (-20) + ")")
                .selectAll("rect")
                .data(array)
                .enter().append("rect")
                .attr("class", "bars")
                .attr("x", function(d, i) {
                    return scaleDetail(i);
                })
                .attr("y", function(d) {
                    return scaleDetail_y(Math.exp(d));
                })
                .attr("height", function(d) {
                    return h - scaleDetail_y(Math.exp(d));
                })
                .attr("width", scaleDetail.rangeBand())

            detailVis.select(".title").text("TWENTYNINE PALMS");

            //Append circles correponding to each station styled according to whether they have luminosity data
            svg.selectAll(".station")
                .data(stations)
                .enter().append("circle")
                .attr("r", function(d){ return d.radius; })
                .attr("class", function(d){
                    if (d.radius == 2) return "station";
                    else return "station hasData"
                })
                .attr("transform", function(d) {
                    return "translate(" + projection([d.longitude, d.latitude]) + ")"
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .on('click', function(d){
                    detailVis.select(".title").text(d.state); //Update the title of the detail visualisation with name of the station selected
                    updateVis(d); //Update the detail visualisation according to where you click
                })
        });
    });
}


d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features

    svg.append("g").attr("id", "states")
        .selectAll(".country")
        .data(usMap)
        .enter().append("path")
        .attr("d", path)
        .on("click", zoomToBB);
    // see also: http://bl.ocks.org/mbostock/4122298

    loadStations();
});

// ZOOMING
function zoomToBB(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  svg.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  svg.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}

function updateVis(d){
    var array = $.map(detail_data[d.USAF], function(value, index) {
        return [value];
    });
    //DETAIL VISUALISATION
    detailVis.selectAll("rect")
        .data(array)
        .attr("y", function(d) {
            return scaleDetail_y(d);  //Height minus data value
        })
        .attr("height", function(d) {
            return h - scaleDetail_y(d);
        })
}

