var BASEURL
if (window.location.href.substring(0,4)=="file") BASEURL = "http://storage.googleapis.com/lillebrot.appspot.com/cron/";
else BASEURL = "http://storage.googleapis.com/"+window.location.hostname+"/cron/";
console.log("BASEURL: "+BASEURL);

var gLogDates; // an array of dates and indexes
var gCurrentDateString; // a string representing the user-selected date
var gDeviceMetas; // an array of metadata for each device for the selected date
var gCurrentDeviceData; // the activity data for the selected device for the selected date
var gTmsStart; // start timestamp for the selected date
var gTmsEnd; // end timestamp for the selected date

var MIN_GLOC_COUNT = 3; // the minimum number of glocs available for a device to be displayed
var MIN_VENT_COUNT = 3; // the minimum number of vents available for a device to be displayed

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
    // grabs device data

    d3.json(BASEURL+dateString+".json", function(error, summaryJSON) {
        if (error) return console.warn(error);
        gTmsStart = summaryJSON.tmsStart;
        gTmsEnd = summaryJSON.tmsEnd;
        
        var num = 0;
        for (key in summaryJSON.devices){
            if (summaryJSON.devices[key].hasLog){ num++;}
        }            
               
        var num = 0;
        gDeviceMetas = new Array();
        for (key in summaryJSON.devices){
            deviceMeta = summaryJSON.devices[key];
            if ((deviceMeta.hasLog)&&(deviceMeta.GLocCount > MIN_GLOC_COUNT)&&(deviceMeta.VentCount > MIN_VENT_COUNT)){
                deviceMeta.num = num++;
                gDeviceMetas.push(deviceMeta);
            }
        }
        //console.log(gDeviceMetas);
        callback();
    });
}

var downloadDailyDeviceActivity = function(dateString,deviceMeta,callback) {
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

downloadLogDates(
    function(){
        console.log("log dates have loaded");
        
        var dateSelector = document.createElement("select");
        document.getElementById("header_wrap").appendChild(dateSelector).id = "date_list";
        var deviceSelector = document.createElement("select");
        document.getElementById("header_wrap").appendChild(deviceSelector).id = "device_list";
                
        var dropDown = d3.select("#date_list")
            .attr("name", "date_list")
            .on("change", dateMenuChanged);
                
        var options = dropDown.selectAll("option")
            .data(gLogDates).enter()
            .append("option")
            .text(function (d) { return d["date"].toLocaleDateString(); })
            .attr("value", function (d) { return d["dateString"]; });
    }
);
    
function dateMenuChanged() {
    console.log("the date selector has changed");
    d3.select("#device_list").selectAll("option").remove();
    gCurrentDateString = d3.event.target.value;
    console.log("loading gDeviceMetas for dateString " + gCurrentDateString);
    downloadDailyDeviceMetas(
        gCurrentDateString, 
        function(){
            console.log(gDeviceMetas);
            
            var dropDown = d3.select("#device_list")
                .attr("name", "device_list")
                .on("change", deviceMenuChanged);
                    
            var options = dropDown.selectAll("option")
                .data(gDeviceMetas).enter()
                .append("option")
                .text(function (d) { return d.name; })
                .attr("value", function (d,i) { return i; });
                
        }
    );                
}

function deviceMenuChanged() {
    console.log("the device selector has changed");
    gCurrentDeviceMeta = gDeviceMetas[d3.event.target.value];
    downloadDailyDeviceActivity(
        gCurrentDateString,
        gCurrentDeviceMeta,
        deviceActivityLoaded
    );
}
    
    