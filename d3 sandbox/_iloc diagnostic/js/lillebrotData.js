var BASEURL;
if (window.location.href.substring(0,4)=="file") BASEURL = "http://designmodelingcopenhagen.appspot.com/paths/iloc?";
else BASEURL = "http://"+window.location.hostname+"/paths/iloc?";
  
    
var gPathsInfo;
    
var downloadPathsInfo = function(dateString,venue,count,timeoutDuration,lingerDistance,lingerDuration,callback){
    url = BASEURL+"dateString="+dateString+"&venue="+venue+"&count="+count+"&timeoutDuration="+timeoutDuration+"&lingerDistance="+lingerDistance+"&lingerDuration="+lingerDuration+"";
    d3.json(url, function(error, pathsInfoJSON) {
        if (error) return console.warn(error);
        gPathsInfo = pathsInfoJSON;
        callback();
    });
}