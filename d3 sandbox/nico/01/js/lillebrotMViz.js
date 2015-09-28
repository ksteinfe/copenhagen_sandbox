

var CANVAS_PADDING = 300;
var stamenLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
    opacity: 0.5,
    attribution: '<a href="http://stamen.com">Stamen Design</a>'
})

var map = L.map('map')
    .addLayer(stamenLayer)
    .setView([55.6746992,12.587323], 13);
        
L.control.scale().addTo(map);

var pixelsPerMeter = function() { 
    //return 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * 180/Math.PI)) / Math.pow(2, map.getZoom()+8)
    var centerLatLng = map.getCenter(); // get map center
    var pointC = map.latLngToContainerPoint(centerLatLng); // convert to containerpoint (pixels)
    var pointX = [pointC.x + 1, pointC.y]; // add one pixel to x
    var pointY = [pointC.x, pointC.y + 1]; // add one pixel to y

    // convert containerpoints to latlng's
    var latLngC = map.containerPointToLatLng(pointC);
    var latLngX = map.containerPointToLatLng(pointX);
    var latLngY = map.containerPointToLatLng(pointY);

    var distanceX = latLngC.distanceTo(latLngX); // calculate distance between c and x (latitude)
    var distanceY = latLngC.distanceTo(latLngY); // calculate distance between c and y (longitude)
    return 1.0/distanceX;    
};

var doAnimate = false;
var removeDeviceMaps = function(){
    //selection.each(function() { this.__transition__.active = 0; });    
    d3.select("#linePath").transition();
    d3.select("#map_svg_wrapper").remove();    
    /*
    for (i=0; i<gDeviceMetas.length; i++){
        d3.select("#linePath_"+gDeviceMetas[i].deviceId).transition();
        d3.select("#svgMap_"+gDeviceMetas[i].deviceId).remove();
        doAnimate = false;
    }*/
}
        
var visualizeDeviceMap = function(deviceData, extent){
    removeDeviceMaps(deviceData);
    deviceMeta = deviceData.meta
    deviceActivity = deviceData.activity
    doAnimate = true;
    
    // Add an SVG element to Leaflet’s overlay pane
    var svgMap = d3.select(map.getPanes().overlayPane)
        .append("div")
        .attr("id", "map_svg_wrapper")
        .append("svg")
        .attr("id", "svgMap")
        //.style("background-color", "rgba(255, 255, 128, 0.1)");
    
    svgMapCanvas = svgMap.append("g")
        .attr("class", "leaflet-zoom-hide");
    
    //minMaxLatLng = [55.6981,55.6726,12.4729,12.6288]; // minLat, maxLat, minLng, maxLng

    geoJSONLine = glocsToGeoJSONLines(deviceActivity.glocs, extent);
    geoJSONPts = glocsToGeoJSONPoints(deviceActivity.glocs, extent);
    //console.log(geoJSONPts);
    
    // GeoJSON to SVG
    var transform = d3.geo.transform({point: projectPoint});
    var d3path = d3.geo.path().projection(transform);
    var toLine = d3.svg.line()
        .interpolate("linear")
        .x(function(d) {return applyLatLngToLayer(d).x})
        .y(function(d) {return applyLatLngToLayer(d).y});

    function applyLatLngToLayer(d) {
        var y = d.geometry.coordinates[1]
        var x = d.geometry.coordinates[0]
        return map.latLngToLayerPoint(new L.LatLng(y, x))
    }    

    extentPts = [geoJSONPts.features]
    
    // create path elements for each of the features
    var pathFeature = svgMapCanvas.append("g").selectAll("path")
        .data(geoJSONLine.features) 
        .enter().append("path");            
            
    // accuracy indicators
    var accMarks = svgMapCanvas.append("g").selectAll("circle")
        .data(geoJSONPts.features) 
        .enter().append("circle")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 10)
        .attr("opacity",0.1);
        
    // line to move along with circle
    var linePath = svgMapCanvas.append("g").selectAll(".lineConnect")
        .data(extentPts)
        .enter().append("path")
        .attr("id", "linePath")
        .attr("class", "lineConnect")
        .style("stroke", "yellow")
        .style("stroke-width", 10)
        .attr("opacity",0.5)
        .style("fill", "none");        
        
    // This will be our traveling circle it will
    // travel along our path
    var marker = svgMapCanvas.append("g").append("circle")
        .attr("r", 10)
        .style("fill", "yellow")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .attr("id", "marker_"+deviceMeta.deviceId)
        .attr("class", "travelMarker");
        
        
    map.on("viewreset", reset);
    reset();
    transition();

    // fit the SVG element to leaflet's map layer
    function reset() {
        //console.log(pixelsPerMeter())
    
        bounds = d3path.bounds(geoJSONLine);

        var topLeft = [bounds[0][0]-CANVAS_PADDING, bounds[0][1]-CANVAS_PADDING],
        bottomRight = [bounds[1][0]+ CANVAS_PADDING,bounds[1][1]+ CANVAS_PADDING];
        //console.log(topLeft);

        svgMap.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        svgMapCanvas.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        //var frqScale = d3.scale.linear().domain([20000,120000]).range([3.0,0.1]).clamp(true); // domain = in; range = out
        pathFeature
            .attr("d", d3path)
            //.style("stroke-width", function(d){console.log(d); return frqScale(d.properties.frq);} )
            .style("stroke-width", 0.25 )
            .style("stroke", "black")
            .style("fill", "none");
        
        var accScale = d3.scale.linear().domain([300.0,5.0]).range([0.1,1.0]).clamp(true); // domain = in; range = out
        accMarks
            .attr("d", d3path)
            .attr("r", function(d,i) { return Math.max( 1.0, d.properties.acc * pixelsPerMeter() *0.75) })
            .style("stroke-width", function(d,i) { return Math.max( 1.0, d.properties.acc * pixelsPerMeter() *0.25) })
            .attr("opacity", function(d,i) { return accScale(d.properties.acc) })           
            .attr("transform", function(d,i) {
                    return "translate(" +
                        applyLatLngToLayer(d).x + "," +
                        applyLatLngToLayer(d).y + ")";
                });
            
        linePath.attr("d", toLine);
            /*
        console.log(pointFeature);
        pointFeature
            .attr("transform",
                function(d) {
                    return "translate(" +
                        applyLatLngToLayer(d[0]).x + "," +
                        applyLatLngToLayer(d[0]).y + ")";
                });*/
            
    }
    
    
        // the transition function could have been done above using
        // chaining but it's cleaner to have a separate function.
        // the transition. Dash array expects "500, 30" where 
        // 500 is the length of the "dash" 30 is the length of the
        // gap. So if you had a line that is 500 long and you used
        // "500, 0" you would have a solid line. If you had "500,500"
        // you would have a 500px line followed by a 500px gap. This
        // can be manipulated by starting with a complete gap "0,500"
        // then a small line "1,500" then bigger line "2,500" and so 
        // on. The values themselves ("0,500", "1,500" etc) are being
        // fed to the attrTween operator
        function transition() {
            linePath.transition()
                .duration(7500)
                .attrTween("stroke-dasharray", tweenDash)
                .each("end", function() {
                    if (doAnimate) d3.select(this).call(transition);// infinite loop
                });
        } //end transition
    
    
        // this function feeds the attrTween operator above with the 
        // stroke and dash lengths
        function tweenDash() {
            return function(t) {
                //total length of path (single value)
                var l = linePath.node().getTotalLength(); 
            
                // this is creating a function called interpolate which takes
                // as input a single value 0-1. The function will interpolate
                // between the numbers embedded in a string. An example might
                // be interpolatString("0,500", "500,500") in which case
                // the first number would interpolate through 0-500 and the
                // second number through 500-500 (always 500). So, then
                // if you used interpolate(0.5) you would get "250, 500"
                // when input into the attrTween above this means give me
                // a line of length 250 followed by a gap of 500. Since the
                // total line length, though is only 500 to begin with this
                // essentially says give me a line of 250px followed by a gap
                // of 250px.
                interpolate = d3.interpolateString("0," + l, l + "," + l);
                //t is fraction of time 0-1 since transition began
                var marker = d3.select("#marker_"+deviceMeta.deviceId);
                
                // p is the point on the line (coordinates) at a given length
                // along the line. In this case if l=50 and we're midway through
                // the time then this would 25.
                var p = linePath.node().getPointAtLength(t * l);
                //Move the marker to that point
                marker.attr("transform", "translate(" + p.x + "," + p.y + ")"); //move marker
                //console.log(interpolate(t))
                return interpolate(t);
            }
        } //end tweenDash
    
    
    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

    
} // end visualizeDeviceMap






