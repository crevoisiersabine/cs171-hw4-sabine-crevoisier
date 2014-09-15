/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;

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

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);
var centered;

var dataSet = {};

function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){
        var stations = [];
        data.forEach(function(d){
            station = {USAF: "", latitude: 0, longitude: 0, state: ""};
            station.USAF = d['USAF'];
            station.latitude = parseFloat(String(d['NSRDB_LAT (dd)']));
            station.longitude = parseFloat(String(d['NSRDB_LON(dd)']));
            station.state = d['STATION'];
            if (projection([station.longitude, station.latitude]) != null){
                stations.push(station);
            }
        })
        svg.selectAll(".station")
            .data(stations)
            .enter().append("circle")
            .attr("class", "station")
            .attr("r", 2)
            .attr("transform", function(d) {
                return "translate(" + projection([d.longitude, d.latitude]) + ")"
            })
    });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;

		//....
		
        loadStations();
    })

}


d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features
    // console.log(usMap);

    svg.append("g").attr("id", "states")
        .selectAll(".country")
        .data(usMap)
        .enter().append("path")
        .attr("d", path)
        .on("click", zoomToBB);
    // see also: http://bl.ocks.org/mbostock/4122298

    loadStations();
    // var screencoord = projection([longitude, latitude]);
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



// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var createDetailVis = function(){

}


var updateDetailVis = function(data, name){
  
}


function resetZoom() {
    
}

