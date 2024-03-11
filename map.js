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
var distance; //meters
var time; //secondes

var points = new Array();

var markers = new Array(); //all the circles along the road.
var itineraryJSON;

var circleMarker;
var circleZoneOfInterest;
var markerBracketOpen;
var markerBracketClose;
var polylineBracket;

//Create the route
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

//Replace with itinerary and get the points, the time, and the distance
routing.on("routesfound", function (e){
    allPos = e.routes[0].coordinates; //Get the points of the intinerary
    // console.log(allPos.length);
    distance = e.routes[0].summary.totalDistance; //Get the distance of the itinerary (in meters)
    time = e.routes[0].summary.totalTime; //Get the time of the itinerary (in seconds)
    itinerary = L.polyline(allPos, {color: 'blue', weight: 5}).addTo(map); //Draw a new polyline with the points
    outline = L.polyline(allPos, {color: 'blue', weight: 20, opacity: 0.25}).addTo(map);
    itineraryJSON =  itinerary.toGeoJSON();
   
    // itinerary.bringToFront();
    console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time));
})

//Returns a latLng as a Point 
function toPixels(latlng){
    return map.latLngToContainerPoint(latlng);
}

//Returns the distance between a point and the itinerary in cm
function getDistanceInCM(latlng, point){
    var closest = L.GeometryUtil.closest(map, allPos, latlng);
    var closestPixel = toPixels(closest);
    return ((point.distanceTo(closestPixel)*2.54/(269/window.devicePixelRatio))); //269 = ppi from phone
}

//Updates text from drag on itinerary
function distancePixelPoints(latlng, point){
    // map.removeLayer(routing_line);
    var distFromLine = getDistanceInCM(latlng, point);
    var closest = L.GeometryUtil.closest(map, allPos, latlng);
    var closestPixel = toPixels(closest);
    // console.log("distance : " + dist);
    if (distFromLine < 0.3 || distFromLine < 0.8 && closestPixel.x < point.x ){
        ETAFloatingText.style.visibility='visible';
        map.dragging.disable();
        
        // if (point.distanceTo(previousLatLng) > 3){
        // console.log( point.distanceTo(previousLatLng) );
        
        // previousLatLng = point;
        isPointOnLine(closest, allPos, 5)
        
        points.push(closest);
        var dist = 0;
        for (var i = 0; i < points.length - 1; i++){
            dist += points[i].distanceTo(points[i+1]);
        }
        var percent = dist*100/distance;
        ETAFloatingText.innerHTML="ETA " + inHours(percent*time/100);
       
    
    } else
    
    {
        ETAFloatingText.style.visibility='hidden';
    }

}

//Creatin of the textbox that follows the cursor
var ETAFloatingText=document.createElement('div');
ETAFloatingText.style.zIndex = 1000;
ETAFloatingText.style.visibility='hidden';

ETAFloatingText.id="cursorText"; //dont change i guess

document.body.appendChild(ETAFloatingText);
var ETAFloatingTextSize=[ETAFloatingText.offsetWidth,ETAFloatingText.offsetHeight];



//Updates the textbox
function moveCursor(e){
    ETAFloatingText.style.left=e.clientX-ETAFloatingTextSize[0]-20+'px';
    ETAFloatingText.style.top=e.clientY-ETAFloatingTextSize[1]-50+'px';
    
}


//Get the screen resolution of the device 
function getResolution() {
    alert("Your screen resolution is: " + (screen.width* window.devicePixelRatio) + "x" + (screen.height* window.devicePixelRatio));
}

//Green marker icon for POI
var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

//Left bracket marker icon
var openBracket = L.icon({
    iconUrl: 'icons/open_bracket.png',
    shadowUrl: 'icons/shadow.png',

    iconSize:     [70, 30], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [35, 10], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

//Right bracket marker icon
var closeBracket = L.icon({
    iconUrl: 'icons/close_bracket.png',
    shadowUrl: 'icons/shadow.png',

    iconSize:     [70, 30], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [35, 25], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
});

//Check is point is on path 
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

//Returns a string "x min y sec"
function toMinutes(time){
    var mins = Math.floor(time/60);
    var rest = (time - (60*mins)).toFixed(0);
    return (mins + " min " /*+ rest + " sec"*/);
}

//Returns a string "x hour y min"
function toHour(time){
    var mins = Math.floor(time/60);
    var hours = Math.floor(mins/60);
    var rest = (mins - (60*hours)).toFixed(0);
    return (hours + " h " + rest + " min");;
}

//Returns a string "x hour y min" but for the time diff 
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


//Handles the dwell/right click on the circle 
function dwellOnCircle(event){
    //greys out rest
    //make bracket appear
    var closest = L.GeometryUtil.closest(map, allPos, event.latlng); //get the closest point on the line
    isPointOnLine(closest, allPos, 5); // add all the points up to this point
        
    points.push(closest); //add this point
    var dist = 0;
    for (var i = 0; i < points.length - 1; i++){ //calculate the distance from the start to this point
        dist += points[i].distanceTo(points[i+1]);
    }
    var percent = dist*100/distance; //get it in %
    var timeDiff = 1800;
    var timeDiffInPercent = timeDiff*100/time; //get the time diff between the brackets in % 
    var percentAbove = percent - timeDiffInPercent; 
    var distAbove = (percentAbove*distance)/100;
    var percentBelow = percent + timeDiffInPercent;
    var distBelow = (percentBelow*distance)/100;

    
    var pointAbove = turf.along(itineraryJSON, distAbove/1000).geometry.coordinates;
    var latlngAbove =  L.latLng(pointAbove[1], pointAbove[0]);
    var markerAbove = L.marker(latlngAbove, {icon: openBracket}).addTo(map);
    // L.marker(latlngAbove).addTo(map);

    var pointBelow = turf.along(itineraryJSON, distBelow/1000).geometry.coordinates;
    var latlngBelow =  L.latLng(pointBelow[1], pointBelow[0]);
    var markerBelow = L.marker(latlngBelow, {icon: closeBracket}).addTo(map);
    // L.marker(latlngBelow).addTo(map);

    if (markerBracketClose != null && markerBracketOpen != null){
        map.removeLayer(markerBracketClose);
        map.removeLayer(markerBracketOpen);
        map.removeLayer(polylineBracket);
    
    }
    markerBracketClose = markerBelow;
    markerBracketOpen = markerAbove;
    // markers.push(markerAbove.getLatLng());
    // markers.push(markerBelow.getLatLng());
    // markerBracketClose.bindPopup("TimeDiff = 30 min");
    // markerBracketOpen.bindPopup("TimeDiff = 30 min");
    isPointOnLine(latlngAbove, allPos, 0.5);
    var pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    isPointOnLine(latlngBelow, allPos, 0.5);
    
    // console.log(points);
    // console.log(pointsAbove);
    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 60, opacity: 0.5}).addTo(map);

    var customOptions =
    {
    'maxWidth': '110',
    'width': '110',
    'autoPan': 'false',
    'autoClose': 'false',
    'closeButton': 'false',
    'className' : 'popupCustom'
    }
    var PopupBelow = "Time Diff = "+toMinutes(timeDiff);
    markerBracketClose.bindPopup(PopupBelow,customOptions);
    markerBracketClose.openPopup(latlngBelow);
    // markerBracketClose.getPopup().openOn(map);

    // var PopupaBOVE = "Time Diff = "+toMinutes(timeDiff);
    markerBracketOpen.bindPopup(PopupBelow,customOptions);
    markerBracketOpen.openPopup(latlngAbove);
    // markerBracketOpen.getPopup().openOn(map);

    //By distance instead of time
    // var pointAbove = turf.along(itineraryJSON, (dist/1000)-10).geometry.coordinates;
    // var latlngAbove =  L.latLng(pointAbove[1], pointAbove[0]);
    // L.marker(latlngAbove, {icon: openBracket}).addTo(map);
    // // L.marker(latlngAbove).addTo(map);

    // var pointBelow = turf.along(itineraryJSON, (dist/1000)+10).geometry.coordinates;
    // var latlngBelow =  L.latLng(pointBelow[1], pointBelow[0]);
    // L.marker(latlngBelow, {icon: closeBracket}).addTo(map);
    // // L.marker(latlngBelow).addTo(map);

}

onpointerdown = (event) => {
    isPointerDown = true;
    //get the points
    //check if it is close to the markers
    //if close to a bracket, drag bracket
    //if close to the dot, drag interval
    var point = L.point(event.clientX, event.clientY); //point in pixel
    var latlng = map.containerPointToLatLng(point); //point in latlng

};

onpointermove = (event) => {
   
    
    // }
    if(isPointerDown){
        moveCursor(event); //text follow mouse
        var point = L.point(event.clientX, event.clientY); //point in pixel
        var latlng = map.containerPointToLatLng(point); //point in latlng
        distancePixelPoints(latlng, point);
    }
};

onpointerup = (event) => {
    var point = L.point(event.clientX, event.clientY);
    var latlng = map.containerPointToLatLng(point);
    var isOnMarker = true;
    // markers.forEach(element => {
        if (circleMarker != null){
            if (circleMarker.getLatLng().distanceTo(latlng) < 5000){
                isOnMarker = false; 
            } 
        }
        console.log("isonmarker circle: " + isOnMarker);
        if (markerBracketClose != null){
        if (markerBracketClose.getLatLng().distanceTo(latlng) < 5000 || markerBracketOpen.getLatLng().distanceTo(latlng) < 5000){
            isOnMarker = false;
        }}
        console.log("isonmarker brackets: " + isOnMarker);
    // });
    if (isPointerDown && isOnMarker){
        ETAFloatingText.style.visibility='hidden';
        var point = L.point(event.clientX, event.clientY);
        var latlng = map.containerPointToLatLng(point);   
        var distFromLine = getDistanceInCM(latlng, point);
        var closest = L.GeometryUtil.closest(map, allPos, latlng);
        var closestPixel = toPixels(closest);
        if (distFromLine < 0.3 || distFromLine < 0.8 && closestPixel.x < point.x ){
            var closest = L.GeometryUtil.closest(map, allPos, latlng);
            var circleClosest = new L.circle(closest, { fill: '#66a1ff', fillOpacity: 1, radius: 300}).addTo(map);
            if (circleMarker != null){
                map.removeLayer(circleMarker);
                map.removeLayer(circleZoneOfInterest);
                markers.forEach(element => {map.removeLayer(element);});
                if (markerBracketClose != null){
                    map.removeLayer(markerBracketClose);
                    map.removeLayer(markerBracketOpen);
                    map.removeLayer(polylineBracket);
                }
            }
            
            circleMarker = circleClosest;
            // markers.push(closest);
            circleClosest.on("contextmenu", dwellOnCircle);
            isPointOnLine(closest, allPos, 5)
            points.push(closest);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            var percent = dist*100/distance;

            var circle = L.circle(closest, {radius: 5000}).addTo(map);
            circleZoneOfInterest = circle;    
            circleClosest.bringToFront();
            
            var opl = new L.OverPassLayer({
                minZoom: 9, //results appear from this zoom levem
                query: `node(around: 5000.0, ${closest.lat}, ${closest.lng})['amenity'='restaurant'];out;`, 
                markerIcon : greenIcon, //custom icon
                minZoomIndicatorEnabled : false,
                onSuccess: function(data) { //doesn't work the markers don't appear
                    for (let i = 0; i < data.elements.length; i++) {
                        let pos;
                        let marker;
                        const e = data.elements[i];
                
                        if (e.id in this._ids) {
                          continue;
                        }
                
                        this._ids[e.id] = true;
                
                        if (e.type === 'node') {
                          pos = L.latLng(e.lat, e.lon);
                        } else {
                          pos = L.latLng(e.center.lat, e.center.lon);
                        }
                
                        if (this.options.markerIcon) {
                          marker = L.marker(pos, { icon: this.options.markerIcon });
                        } else {
                          marker = L.circle(pos, 20, {
                            stroke: false,
                            fillColor: '#E54041',
                            fillOpacity: 0.9
                          });
                        }
                
                        const popupContent = this._getPoiPopupHTML(e.tags, e.id);
                        const popup = L.popup().setContent(popupContent);
                        marker.bindPopup(popup);
                        markers.push(marker);
                
                        this._markers.addLayer(marker);
                      }
                    // data.elements.forEach(element => { markers.push(element); });
                    // console.log(data);
                },
                // afterRequest: function()  {
                   
                // }, // we want to keep the circle
            });
            map.addLayer(opl);

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
        outline.setStyle({weight:60});
    } 
}


