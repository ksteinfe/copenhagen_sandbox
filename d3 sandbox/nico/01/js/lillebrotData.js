var BASEURL
if (window.location.href.substring(0,4)=="file") BASEURL = "http://storage.googleapis.com/lillebrot.appspot.com/cron/";
else BASEURL = "http://storage.googleapis.com/"+window.location.hostname+"/cron/";
console.log(BASEURL);

var MIN_GLOC_COUNT = 3;
var MIN_VENT_COUNT = 3;
//var MIN_ILOC_COUNT = 3;
var MAX_GLOC_DELTA = 60 * 30;
var gLogDates;
var gCurrentDateString;
var gDeviceMetas;
var gCurrentDeviceMeta;
var gCurrentDeviceData;


    var downloadLogDates = function(callback){
		// grabs dates 
		
        d3.json(BASEURL+"logdates.json", function(error, logdatesJSON) {
            if (error) return console.warn(error);
            gLogDates = new Array();
            
            for (n in logdatesJSON){
                d = logdatesJSON[n];
                ds = ""+d;
                datething = Array();
                datething["dateString"] = ds
                datething["dateInt"] = d
                datething["date"] = new Date("20"+ds.substring(0,2),ds.substring(2,4)-1,ds.substring(4,6));
                gLogDates.push(datething);
            }
            
            gCurrentDateString = gLogDates[0]["dateString"];
            //console.log(gLogDates);
            callback();
        });
    }

        
    var downloadDailyDeviceMetas = function(dateString, callback){
        // grabs divice data
		//var summaryData; // a global

        d3.json(BASEURL+dateString+".json", function(error, summaryJSON) {
            if (error) return console.warn(error);
            tmsStart = summaryJSON.tmsStart;
            tmsEnd = summaryJSON.tmsEnd;
            
            var num = 0;
            for (key in summaryJSON.devices){
                if (summaryJSON.devices[key].hasLog){ num++;}
            }            
            
            // scales and axes
            xScale = d3.scale.linear().domain([tmsStart,tmsEnd]).range([wpad,w-wpad]); // domain = in; range = out
            yScale = d3.scale.linear().domain([-1,num]).range([hpad*1.5,h-hpad*0.75]); // domain = in; range = out
            
            var num = 0;
            gDeviceMetas = new Array();
            for (key in summaryJSON.devices){
                deviceMeta = summaryJSON.devices[key];
                if ((deviceMeta.hasLog)&&(deviceMeta.GLocCount > MIN_GLOC_COUNT)&&(deviceMeta.VentCount > MIN_VENT_COUNT)){
                    deviceMeta.num = num++;
                    gDeviceMetas.push(deviceMeta);
                }
            }
			console.log(gDeviceMetas);
            callback();
        });
    }
    
    var downloadDailyDeviceActivity = function(dateString,deviceMeta,callback) {
        //loads up data
		//console.log("downloadDailyDeviceActivity");
        d3.json(BASEURL+dateString+"/"+dateString+"_"+deviceMeta.deviceId+".json", function(error, deviceActivity) {
            if (error) return console.warn(error);
            deviceData = Array()
            deviceData.meta = deviceMeta;
            deviceData.activity = deviceActivity;
            gCurrentDeviceData = deviceData;
            //console.log(gCurrentDeviceData);
            callback();
        })
    }
    
    
    var serviceStartTimes = function(ventsArray){
        MIN_SERVICE_START_DELTA = 60 * 2;
        //ventsArray.sort(function(a,b){return a.timestamp - b.timestamp})
        
        serviceStarts = new Array();
        lastTms = 0;
        for (key in ventsArray){
            vent = ventsArray[key];
            if (vent.flg==5) { // 5 is service_start
                if (vent.timestamp - lastTms > MIN_SERVICE_START_DELTA) serviceStarts.push(vent.timestamp);
            }
        }       
        return serviceStarts;   
    }
    
    
    var glocSpeeds = function(glocsArray){
        //GREAT_ARC = d3.geo.greatArc();
        speedArr = new Array();
        speedArr.push([glocsArray[0].timestamp,0,glocsArray[0].lat,glocsArray[0].lng]); // tms, spd, lat, lng
        for (i=1; i<glocsArray.length; i++){
            prev = speedArr[speedArr.length-1]
            dist = haversine(prev[2],prev[3],glocsArray[i].lat,glocsArray[i].lng);
            spd = dist / (glocsArray[i].timestamp - prev[0]);
            speedArr.push([glocsArray[i].timestamp,spd,glocsArray[i].lat,glocsArray[i].lng]); // tms, spd, lat, lng
        }
        return speedArr;   
    }    
    
    var activeServicePeriods = function(glocsArray){
        glocsArray.sort(function(a,b){return a.timestamp - b.timestamp})

        glocActivePeriods = new Array();
        lastTms = glocsArray[0].timestamp;
        for (i=1; i<glocsArray.length-1; i++){
            if (glocsArray[i].timestamp - glocsArray[i-1].timestamp > MAX_GLOC_DELTA){
                glocActivePeriods.push([lastTms,glocsArray[i-1].timestamp]);
                lastTms = glocsArray[i].timestamp;
            }
        }
        glocActivePeriods.push([lastTms,glocsArray[glocsArray.length-1].timestamp])
        
        return glocActivePeriods;
    }
       
    
    var screenActivity = function(ventsArray,divs){
        counts = Array();
        scl = d3.scale.linear().domain([0,divs-1]).range([tmsStart,tmsEnd]).clamp(true); // domain = in; range = out
        for (i=0; i<divs; i++){ counts.push([[scl(i),scl(i+1)],0]);}
        
        scl = d3.scale.linear().domain([tmsStart,tmsEnd]).rangeRound([0,divs-1]).clamp(true); // domain = in; range = out
        for (key in ventsArray){
            vent = ventsArray[key];
            if (vent.flg==12) { // 11 is screen_on
                counts[scl(vent.timestamp)][1] += 1;
            }
        }
        return counts;   
    }
    
    
    var networkActivity = function(ventsArray,divs){
        counts = Array();
        scl = d3.scale.linear().domain([0,divs-1]).range([tmsStart,tmsEnd]).clamp(true); // domain = in; range = out
        for (i=0; i<divs; i++){ counts.push([[scl(i),scl(i+1)],0.0]);}
        
        scl = d3.scale.linear().domain([tmsStart,tmsEnd]).rangeRound([0,divs-1]).clamp(true); // domain = in; range = out
        for (key in ventsArray){
            vent = ventsArray[key];
            if (vent.flg==13 | vent.flg==14) { // network traffic up and down
                //console.log(vent.timestamp+", "+scl(vent.timestamp))
                counts[scl(vent.timestamp)][1] += parseInt(vent.msg)/1000;
            }
        }
        
        return counts;   
    }
    
    
    
    var glocsToGeoJSONPoints = function(glocsArray, extent){
        if (extent != null){
            goodGlocs = Array()
            for (i=0; i<glocsArray.length; i++){
                if ((glocsArray[i].timestamp > extent[0])&&(glocsArray[i].timestamp < extent[1])) 
                    goodGlocs.push(glocsArray[i])
            }
            glocsArray = goodGlocs
        }
    
       var geoJSON = {type: "FeatureCollection", features: Array()};
        for (i=0; i<glocsArray.length; i++){
            geoJSON.features.push({type:"Feature",properties:{timestamp:glocsArray[i].timestamp,acc:glocsArray[i].acc},geometry:{type:"Point", coordinates:[glocsArray[i].lng,glocsArray[i].lat]}});
        }
        return geoJSON;
    }
    
    var glocsToGeoJSONLineString = function(glocsArray){
        //testGeo.features.push({type:"Feature",properties:{},geometry:{type:"Point", coordinates:[12.4729,55.6981]}});
        //testGeo.features.push({type:"Feature",properties:{},geometry:{type:"Point", coordinates:[12.6288,55.6981]}});
        //testGeo.features.push({type:"Feature",properties:{},geometry:{type:"Point", coordinates:[12.4729,55.6726]}});
        
        //testGeo.features.push({type:"Feature",properties:{},geometry:{type:"LineString", coordinates:[ [12.586898803710938,55.68160103673077], [12.589902877807617,55.67927821918324] ]}});
        coords = Array()
        for (i=0; i<glocsArray.length; i++){
            coords.push([glocsArray[i].lng,glocsArray[i].lat])
        }
        var geoJSON = {type: "FeatureCollection", features: Array()};
        geoJSON.features.push({type:"Feature",properties:{},geometry:{type:"LineString", coordinates:coords}});
        return geoJSON;
    }
    
    var glocsToGeoJSONLines = function(glocsArray, extent){
        if (extent != null){
            goodGlocs = Array()
            for (i=0; i<glocsArray.length; i++){
                if ((glocsArray[i].timestamp > extent[0])&&(glocsArray[i].timestamp < extent[1])) 
                    goodGlocs.push(glocsArray[i])
            }
            glocsArray = goodGlocs
        }
        
    
        var geoJSON = {type: "FeatureCollection", features: Array()};
        for (i=1; i<glocsArray.length; i++){
            geoJSON.features.push({
                type:"Feature",
                properties:{
                    acc: glocsArray[i].acc,
                    frq: glocsArray[i].frq,
                    timestamp: glocsArray[i].timestamp
                },
                geometry:{
                    type:"LineString", 
                    coordinates:[[glocsArray[i-1].lng,glocsArray[i-1].lat],[glocsArray[i].lng,glocsArray[i].lat]]
                }
            });
        }
        return geoJSON;
    }
    

    
    
    
    
    
    var haversine = function(lat1,lon1,lat2,lon2){
        Number.prototype.toRad = function() { return this * Math.PI / 180; }

        var R = 6371 * 1000; // m 
        var x1 = lat2-lat1;
        var dLat = x1.toRad();  
        var x2 = lon2-lon1;
        var dLon = x2.toRad();  
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
                        Math.sin(dLon/2) * Math.sin(dLon/2);  
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; 
        return d;
    }
    
    
    
    
    
    
    
    
    