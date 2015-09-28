

var rowOffst = 15;
w = 800;
h = 100;
wpad = 20; 
hpad = 20; // more on the top, less on the botom

var removeDeviceTimelines = function(){
    d3.select("#timeline").remove();
    //for (i=0; i<gDeviceMetas.length; i++){
        //d3.select("#linePath_"+gDeviceMetas[i].deviceId).transition();
        //d3.select("#svgMap_"+gDeviceMetas[i].deviceId).remove();
    //}
}

var visualizeDeviceTimeline = function(deviceData){
    removeDeviceTimelines();
    deviceMeta = deviceData.meta
    deviceActivity = deviceData.activity
    
    var svgTimeline = d3.select("#timeline_wrap")
        .append("svg")
        .attr("id", "timeline")
        .attr("width", w)
        .attr("height", h);
    
    var gsvg = svgTimeline.append("g").attr("id", deviceMeta.deviceId);
    var pY = yScale(deviceMeta.num);
    
    // GLOCS
    vizTimlineGlocs(gsvg, pY, deviceMeta, deviceActivity);
    
    // SERVICE PERIODS
    vizServicePeriods(gsvg, pY- rowOffst, deviceMeta, deviceActivity);

    // ACTIVITY
    vizScreenActivity(gsvg, pY + rowOffst, deviceMeta, deviceActivity);
    vizNetActivity(gsvg, pY + rowOffst * 2, deviceMeta, deviceActivity);
    
    // SPEED
    vizSpeed(gsvg, pY + rowOffst * 4, deviceMeta, deviceActivity);
}

var vizTimlineGlocs = function(svg, pY, deviceMeta, deviceActivity){
    var gsvg = svg.append("g").attr("id", "vizTimlineGlocs");
    var glocsData = deviceActivity.glocs;
    var frqScale = d3.scale.linear().domain([20000,120000]).range([2,3]).clamp(true); // domain = in; range = out
    
    gsvg.selectAll("circle")
        .data(glocsData)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d.timestamp);
        })
        .attr("cy", pY)                    
        .attr("r",function(d) {
            return frqScale(d.frq);
        })
        .style("stroke",function(d) {
            if (d.frq < 40000) return "transparent";
            return "#999";
        })
        .style("fill",function(d) {
            if (d.frq < 40000) return "black";
            return "transparent";
        });
}


var vizServicePeriods = function(svg, pY, deviceMeta, deviceActivity){
    var gsvg = svg.append("g").attr("id", "vizServicePeriods");
    var servicePeriodData = activeServicePeriods(deviceActivity.glocs);
    var serviceStartData = serviceStartTimes(deviceActivity.vents);
        
    gsvg.append("g").selectAll("circle")
        .data(serviceStartData)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d);
        })
        .attr("cy", pY)
        .attr("r", rowOffst/8)
        //.style("stroke-width", 2)
        //.style("stroke", "black")
        .style("fill", "black");
        
    gsvg.append("g").selectAll("line")
        .data(servicePeriodData)
        .enter()
        .append("line")
        .attr("x1", function(d) { return xScale(d[0]);  })
        .attr("x2", function(d) { return xScale(d[1]);  })
        .attr("y1", pY) 
        .attr("y2", pY)
        .style("stroke", "black");
    gsvg.append("g").selectAll("line")
        .data(servicePeriodData)
        .enter()
        .append("line")
        .attr("x1", function(d) { return xScale(d[1]);  })
        .attr("x2", function(d) { return xScale(d[1]);  })
        .attr("y1", pY + 5) 
        .attr("y2", pY - 5) 
        .style("stroke-width", 1)
        .style("stroke", "black");
        
}
      
        
var vizNetActivity = function(svg, pY, deviceMeta, deviceActivity){
    var gsvg = svg.append("g").attr("id", "vizNetActivity");
    var netActiv = networkActivity(deviceActivity.vents,tdivs);
    
    maxActiv = -1;
    minActiv = Number.MAX_VALUE;
    for (i=0; i<netActiv.length; i++) {
        if (netActiv[i][1] > maxActiv) maxActiv = netActiv[i][1];
        if (netActiv[i][1] < minActiv) minActiv = netActiv[i][1];
    }
    var color = d3.scale.linear().domain([minActiv,maxActiv]).range(["blue","blue"]);
    var opacity = d3.scale.linear().domain([minActiv,maxActiv]).range([0.0,1.0]);
    
    gsvg.append("g").selectAll("rect")
        .data(netActiv)
        .enter()
        .append("rect")
        .attr("x", function(d) { return xScale(d[0][0]);  })
        .attr("y", pY)
        .attr("width", function(d) { return xScale(d[0][1]) - xScale(d[0][0]);})
        .attr("fill-opacity", function(d) { return opacity(d[1]);})
        .style("fill", function(d) { return color(d[1]);})
        .attr("height", 10);
}

var vizScreenActivity = function(svg, pY, deviceMeta, deviceActivity){
    var gsvg = svg.append("g").attr("id", "vizScreenActivity");
    
    tdivs = 24*6 // 10-mins
    var scrActiv = screenActivity(deviceActivity.vents,tdivs);
    maxActiv = -1
    for (i=0; i<scrActiv.length; i++) if (scrActiv[i][1] > maxActiv) maxActiv = scrActiv[i][1];
    //console.log(maxActiv);

    var color = d3.scale.linear().domain([0,maxActiv]).range(["red","red"]);
    var opacity = d3.scale.linear().domain([0,maxActiv]).range([0.0,1.0]);
    
    gsvg.append("g").selectAll("rect")
        .data(scrActiv)
        .enter()
        .append("rect")
        .attr("x", function(d) { return xScale(d[0][0]);  })
        .attr("y", pY)
        .attr("width", function(d) { return xScale(d[0][1]) - xScale(d[0][0]);})
        .attr("fill-opacity", function(d) { return opacity(d[1]);})
        .style("fill", function(d) { return color(d[1]);})
        .attr("height", 10);
}

var vizSpeed = function(svg, pY, deviceMeta, deviceActivity){
    var gsvg = svg.append("g").attr("id", "vizSpeed");
    var glocSpd = glocSpeeds(deviceActivity.glocs);  // tms, spd, lat, lng
    
    maxSpeed = 0
    for (i=0; i<glocSpd.length; i++) if (glocSpd[i][1] > maxSpeed) maxSpeed = glocSpd[i][1];
    //console.log(maxSpeed);
    
    var spdScl = d3.scale.log().domain([0.1,6.0]).clamp(true).range([pY,pY-20]);
    var lineGen = d3.svg.line()
        .x(function(d){return xScale(d[0]);})
        .y(function(d){return spdScl(d[1]);})
        .interpolate("basis");
    gsvg.append("g").append('svg:path')
        .attr('d',lineGen(glocSpd));
}



