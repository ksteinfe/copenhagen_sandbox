


var removeControl = function(){
        d3.select("#control").remove();
}

var visualizeControl = function(){
    removeControl();
    var contW = w;
    var contH = 40;
    hpad = 20;
    
    var svgControl = d3.select("#control_wrap")
        .append("svg")
        .attr("id", "control")
        .attr("width", contW)
        .attr("height", contH + 2);

    
    svgControl.append("rect")
        .attr("class", "grid-background")
        .attr('transform',"translate(0,"+hpad+")")
        .attr("width", contW)
        .attr("height", contH-hpad);
    
        
    dStart = new Date(tmsStart*1000);
    dEnd = new Date(tmsEnd*1000);
    svgControl.append("g")
        .attr('class','axis')
        .attr('transform',"translate(0,"+(hpad-2)+")")
        .call(d3.svg.axis()
            .scale(
                d3.time.scale()
                .domain([dStart,dEnd])
                .range([wpad,w-wpad])
            )
            .ticks(d3.time.hour,1)
            .tickFormat(d3.time.format.utc("%H"))
            .tickSize(4)
            //.tickPadding(10)
            .orient('top')
    );
    
    svgControl.append("g")
        .attr("class", "x grid")
        .attr("height", contH - hpad)
        .attr("transform", "translate(0," + (hpad) + ")")
        .call(d3.svg.axis()
            .scale(
                d3.time.scale()
                .domain([dStart,dEnd])
                .range([wpad,w-wpad])
            )
            .orient("bottom")
            .ticks(d3.time.hour, 1)
            .tickSize(contH - hpad)
            .tickFormat(""))
        .selectAll(".tick")
        .classed("minor", function(d) { return d.getHours(); });            
        
    var brush = d3.svg.brush()
        .x(xScale)
        .extent([new Date(tmsStart*1000), new Date(tmsEnd*1000)])
        .on("brush", brushed)
        .on("brushend", brushended);

    var gBrush = svgControl.append("g")
        .attr("class", "brush")
        .call(brush);

    gBrush.selectAll("rect")
        .attr('transform',"translate(0,"+hpad+")")
        .attr("height", contH-hpad);        

    function brushed() {        
        extent1 = brush.extent().map(Math.round);
        d3.select(this).call(brush.extent(extent1));
    }
    function brushended() {
        if (brush.extent()[0] == brush.extent()[1])  visualizeDeviceMap(gCurrentDeviceData);
        else visualizeDeviceMap(gCurrentDeviceData, brush.extent()); 
        //for (key in gDeviceData){ visualizeDeviceMap(gDeviceData[key], brush.extent());  }
    }    
    
}