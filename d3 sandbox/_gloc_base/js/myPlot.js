
var plotW = 640;
var plotH = 480;
var hPad = 20;
var wPad = 20;
var xScale;


var tearDownPlot = function(){ d3.select("#myPlot").remove(); } // removes our SVG from the page}
var doPlot = function(deviceData){
    tearDownPlot(); // start by removing any old plots
    console.log(deviceData);
    deviceMeta = deviceData.meta;
    deviceActivity = deviceData.activity;
            
    var plotSVG = d3.select("#plot_wrap").append("svg")
        .attr("id", "myPlot")
        .attr("class", "plot_canvas")
        .attr("width", plotW)
        .attr("height", plotH);
        
    // since all plots will use time along their x-axis, establish a scale for all to use and draw an axis
    xScale = d3.scale.linear().domain([gTmsStart,gTmsEnd]).range([wPad,plotW-wPad]).clamp(true); // domain = in; range = out
    vizTimelineAxis(plotSVG);        
        
    vizTimlineGlocs(plotSVG, 30, deviceData);
}

var vizTimelineAxis = function(svg){
    // draws the x-axis with ticks
    dStart = new Date(gTmsStart*1000);
    dEnd = new Date(gTmsEnd*1000);
    svg.append("g").attr('class','axis').attr('transform',"translate(0,"+(hPad)+")")
    .call(d3.svg.axis()
        .scale( d3.time.scale().domain([dStart,dEnd]).range([wPad,plotW-wPad]) )
        .ticks(d3.time.hour,1)
        .tickFormat(d3.time.format.utc("%H"))
        .tickSize(4)
        //.tickPadding(10)
        .orient('top')
    );
}

var vizTimlineGlocs = function(svg, pY, deviceData){
    var gsvg = svg.append("g").attr("id", "vizTimlineGlocs");
    
    var yDtScale = d3.scale.linear().domain([20,480]).range([50,0]).clamp(true); // domain = in; range = out
    
    glocsData = deviceData.activity.glocs
    
    gsvg.selectAll("circle")
        .data(glocsData)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d.timestamp);
        })                
        .attr("r",function(d) {
            if (d.frq < 40000) return 10;
            return 2;
        })
        .style("stroke",function(d) {
            if (d.frq < 40000) return "transparent";
            return "#999";
        })
        .style("fill",function(d) {
            if (d.frq < 40000) return "black";
            return "transparent";
        })        
        .attr("cy",function(d,n) {
            if (n==0) return pY;
            dT = d.timestamp - glocsData[n-1].timestamp
            return yDtScale(dT) + pY;
        });
}



