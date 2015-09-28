

var PPM;
var xScale;
var yScale;
var svgPlan;

var initPlanViz = function(){
    
    PPM = imgDim[1] / venueInfo.yDimMtrs;
    console.log("PPM: "+PPM);
    xScale = d3.scale.linear().domain([0,venueInfo.xDimMtrs]).range([0,imgDim[0]]).clamp(true); // domain = in; range = out
    yScale = d3.scale.linear().domain([0,venueInfo.yDimMtrs]).range([0,imgDim[1]]).clamp(true); // domain = in; range = out
    uncOpacityScale = d3.scale.linear().domain([4.0,15.0]).range([0.1,0.0]).clamp(true); // domain = in; range = out
    uncWeightScale = d3.scale.linear().domain([4.0,10.0]).range([10,1.0]).clamp(true); // domain = in; range = out
   
     svgPlan = d3.select("#plan_wrap")
        .append("svg")
        .attr("id", "planViz")
        .attr("width", imgDim[0])
        .attr("height", imgDim[1]);
    }


var vizDevice = function(deviceInfo){
    console.log(deviceInfo)

    catColorScale = d3.scale.category20().domain([0,deviceInfo.paths.length])
    for (d in deviceInfo.paths){
        //vizPlanUncerts(svgPlan, deviceInfo.paths[d]);
        vizPlanLines(svgPlan, deviceInfo.paths[d], catColorScale(d));

        
    }
}


var vizPlanUncerts = function(svg,pathInfo){
    var gsvg = svg.append("g");

    gsvg.selectAll("circle")
        .data(pathInfo.ilocs)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.mtx); })
        .attr("cy", function(d) { return yScale(d.mty); })  
        .attr("r",function(d) { return d.unc * PPM / 2.0; })
        .attr("stroke-opacity", function(d) { return uncOpacityScale(d.unc);})
        .style("stroke-width", function(d) { return uncWeightScale(d.unc);})
        .style("stroke", "black")
        .style("fill","none");
}

var vizPlanLines = function(svg,pathInfo,clr){
    var gsvg = svg.append("g");
    
    lineData = Array();
    for (i=1; i<pathInfo.ilocs.length; i++){
        lineData.push({"locA":pathInfo.ilocs[i-1], "locB":pathInfo.ilocs[i]})
    }
    //colorScale = d3.scale.linear().domain([0,lineData.length]).range(["red", "blue", "red"]);    
    //rainbowColorScale = d3.scale.linear().domain([0,lineData.length]).range(["hsl(0,80%,50%)", "hsl(360,80%,50%)"]).interpolate(d3.interpolateString);
    
    
    gsvg.selectAll("line")
        .data(lineData)
        .enter()
        .append("line")
        .attr("x1", function(d){return xScale(d.locA.mtx);})
        .attr("y1", function(d){return yScale(d.locA.mty);})
        .attr("x2", function(d){return xScale(d.locB.mtx);})
        .attr("y2", function(d){return yScale(d.locB.mty);})
        .attr("stroke-width", 2)
        //.attr("stroke", function(d,i){return colorScale(i);})
        .attr("stroke", clr);
        
}

