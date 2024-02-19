var map = L.map('map', {dragging: true}).setView([52.19226,0.15216], 16);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // minZoom: 10,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    closePopupOnClick: false,
}).addTo(map);

var itinerary; 
var outline;

var routing_line;
var isPointerDown = false;

var allPos;
var distance;
var time;

var allPosPixels  = new Array();
var points = new Array();

var previousLatLng;

var routing = L.Routing.control({
    
    waypoints: [
        L.latLng(48.70973285709232, 2.1626934894717214),
        // L.latLng(48.70577272850384, 2.185514438847031)
        L.latLng(43.089068907903574, 2.6198013248458296)
    ],
    routeWhileDragging: false,
    geocoder: L.Control.Geocoder.nominatim(),
    lineOptions : {
        style: [{color: 'black', opacity: 0.15, weight: 30}, {color: 'white', opacity: 0.8, weight: 20}, {color: 'red', opacity: 1, weight: 10}],
        addWaypoints: false
        
    },
    routeLine: function(route, options) {
        routing_line = L.Routing.line(route, options);
        
        return routing_line;
    }
}).addTo(map);


routing.on("routesfound", function (e){
    allPos = e.routes[0].coordinates; //Get the points of the intinerary
    // console.log(allPos.length);
    distance = e.routes[0].summary.totalDistance; //Get the distance of the itinerary (in meters)
    time = e.routes[0].summary.totalTime; //Get the time of the itinerary (in seconds)
    itinerary = L.polyline(allPos, {color: 'blue', weight: 5}).addTo(map); //Draw a new polyline with the points
    outline = L.polyline(allPos, {color: 'blue', weight: 20, opacity: 0.25}).addTo(map);
   
    // itinerary.bringToFront();
    console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time));
})

function toPixels(latlng){
    return map.latLngToContainerPoint(latlng);
}

function buildPosPixels(latlng){
    allPosPixels.push(toPixels(latlng));
}

function getDistanceInCM(latlng, point){
    var closest = L.GeometryUtil.closest(map, allPos, latlng);
    var closestPixel = toPixels(closest);
    return ((point.distanceTo(closestPixel)*2.54/(269/window.devicePixelRatio)));
}

function getDistanceInPixel(dist){
    return (dist*((269/window.devicePixelRatio)/2.54));

}

function distancePixelPoints(latlng, point){
    map.removeLayer(routing_line);
    var dist = getDistanceInCM(latlng, point);
    var closest = L.GeometryUtil.closest(map, allPos, latlng);
    // console.log("distance : " + dist);
    if (dist < 0.6 ){
        ETAFloatingText.style.visibility='visible';
        
        // if (point.distanceTo(previousLatLng) > 3){
        // console.log( point.distanceTo(previousLatLng) );
        
        previousLatLng = point;
        isPointOnLine(closest, allPos, 5)
        
        points.push(closest);
        var dist = 0;
        for (var i = 0; i < points.length - 1; i++){
            dist += points[i].distanceTo(points[i+1]);
        }
        var percent = dist*100/distance;
        ETAFloatingText.innerHTML="ETA " + inHours(percent*time/100);
       
    } else {
        ETAFloatingText.style.visibility='hidden';
    }

}




// document.body.onmousemove=moveCursor;
var ETAFloatingText=document.createElement('div');
ETAFloatingText.style.zIndex = 1000;
ETAFloatingText.style.visibility='hidden';

ETAFloatingText.id="cursorText"; //dont change i guess

document.body.appendChild(ETAFloatingText);
var ETAFloatingTextSize=[ETAFloatingText.offsetWidth,ETAFloatingText.offsetHeight];

function moveCursor(e){
    ETAFloatingText.style.left=e.clientX-ETAFloatingTextSize[0]+'px';
    ETAFloatingText.style.top=e.clientY-ETAFloatingTextSize[1]-50+'px';
}

 
function getResolution() {
    alert("Your screen resolution is: " + (screen.width* window.devicePixelRatio) + "x" + (screen.height* window.devicePixelRatio));
}

var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

function isPointOnLine(point, path, accuracy) {
    points.length = 0;
    // console.log(path.length);
    for (var i = 0; i < path.length - 1; i++) {
        points.push(path[i]);
        
        if (L.GeometryUtil.belongsSegment(point, path[i], path[i + 1], accuracy)) {
            return true;
        }
    }
    return false;
}

function toMinutes(time){
    var mins = Math.floor(time/60);
    var rest = (time - (60*mins)).toFixed(0);
    return (mins + " min " + rest + " sec");
}

function toHour(time){
    var mins = Math.floor(time/60);
    var hours = Math.floor(mins/60);
    var rest = (mins - (60*hours)).toFixed(0);
    return (hours + " h " + rest + " min");;
}

function inHours(time){
    var now = new Date();
    var now_hour = now.getHours();
    var now_min = now.getMinutes();
    var time_mins = Math.floor(time/60);
    var time_hours = Math.floor(time_mins/60);
    var rest = Math.floor(time_mins - (60*time_hours));
    var add = 0;
    var in_minutes = now_min + rest;
    while(in_minutes >= 60) {
        in_minutes = in_minutes - 60;
        add ++;
    }
    var in_hours = now_hour + time_hours + add;
    if (in_hours >= 24){
        in_hours = in_hours - 24;
    }
    return (in_hours + " h " + in_minutes + " min");


}

onpointerdown = (event) => {
    
    map.removeLayer(routing_line);
        // lineExits = false;
    
    // window.alert("pointer");
    event.preventDefault();
    isPointerDown = true;
    
    
    // var touch = event.touches[0];
    // var point = L.point(touch.screenX, touch.screenY);
    // var latlng = map.containerPointToLatLng(point);
    

    var point = L.point(event.clientX, event.clientY);
    var latlng = map.containerPointToLatLng(point);
    previousLatLng = point;
    var dist = getDistanceInCM(latlng, point);
    if (dist < 0.5){ //If close to line: disable pan of map and make text appear
        map.dragging.disable();
        moveCursor(event);
        ETAFloatingText.style.visibility='visible';
    }
};

onpointermove = (event) => {
    map.removeLayer(routing_line);
    if(isPointerDown){
        moveCursor(event); //text follow mouse
        // var touch = event.touches[0];
        // var point = L.point(touch.screenX, touch.screenY);
        var point = L.point(event.clientX, event.clientY); //point in pixel
        var latlng = map.containerPointToLatLng(point); //point in latlng
        // console.log("point: " + point + "containerpoint : " + toPixels(latlng));
        distancePixelPoints(latlng, point);
    }
};

onpointerup = (event) => {
    // window.alert("true");
    if (isPointerDown){
        ETAFloatingText.style.visibility='hidden';
        // var touch = event.touches[0];
        // var point = L.point(touch.screenX, touch.screenY);
        var point = L.point(event.clientX, event.clientY);
        var latlng = map.containerPointToLatLng(point);       
        if(getDistanceInCM(latlng, point) < 0.5){
            var closest = L.GeometryUtil.closest(map, allPos, latlng);
            var marker = new L.marker(closest, {draggable: 'false'}).addTo(map);
            isPointOnLine(closest, allPos, 5)
            points.push(closest);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            var percent = dist*100/distance;

            marker.bindPopup("ETA " + inHours(percent*time/100), {maxWidth : 200});

            // var opl = new L.OverPassLayer({
            //     minZoom: 9, //results appear from this zoom levem
            //     query: `node(around: 5000.0, ${latlng.lat}, ${latlng.lng})['amenity'='restaurant'];out;`, 
            //     markerIcon : greenIcon, //custom icon
            //     minZoomIndicatorEnabled : false,
            //     // onSuccess: function(data) {

            //     //     for(i=0;i<data.elements.length;i++) {
            //     //         e = data.elements[i];

                        
            //     //         var pos = new L.LatLng(e.lat, e.lon);
            //     //         var color = 'green';
            //     //         L.circle(pos, 5, {
            //     //             color: color,
            //     //             fillColor: '#fa3',
            //     //             fillOpacity: 1,
            //     //         })
            //     //         // .bindPopup(JSON.stringify(e.tags))
            //     //         .addTo(map);
                    
            //     //     }
            //     // },
            // });
            // map.addLayer(opl);

        }
            

        isPointerDown = false;
        map.dragging.enable();
        
        var zoom = map.getZoom();
        // console.log(itinerary.weight + "    " + zoom);
        if (zoom > 14){
            itinerary.setStyle({weight : 10*(zoom-13)}); //keep the itinerary always bigger than road 
        } else {
            itinerary.setStyle({weight : 10});
        }
        outline.setStyle({weight:80});
        // itinerary.setStyle({weight : 5*(map.getZoom()-5)})
        // itinerary.weight = 5;
    }
}