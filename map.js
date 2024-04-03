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
var isMovingMarker = false;
var isMovingBrackets = false;

var allPos;
var distance; //meters
var time; //secondes

var points = new Array();

var markers = new Array(); //all the circles along the road.
var itineraryJSON;

var circleMarker;
var circleZoneOfInterest;
var markerBracketOpen = null;
var markerBracketClose = null;
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
    itinerary = L.polyline(allPos, {color: 'blue', weight: 5, lineCap: 'butt'}).addTo(map); //Draw a new polyline with the points
    outline = L.polyline(allPos, {color: 'blue', weight: 20, opacity: 0.25/*lineCap: 'butt'*/, className: "route"}).addTo(map); // Draw the interaction zone
    itineraryJSON =  itinerary.toGeoJSON(); //convert the itinerary to JSON for distance purposes
    
    
    /**************************************
     * 2 ways to add something every x km *
     *************************************/
    // var dist = 0;
    // for (var i = 0; i < allPos.length - 1; i++){
    //     dist += allPos[i].distanceTo(allPos[i+1]);
    //     if (dist > 100000){
    //         var marker = L.marker(allPos[i+1]).addTo(map); 
    //         marker.bindPopup("dist: " + dist/1000 + "km");

    //         dist = 0;
    //     }
    // }

    // var closestAbove = L.GeometryUtil.closest(map, allPos, latlngAbove);
    // isPointOnLine(closestAbove, allPos, 0.5);
    // var pointsAbove = new Array();
    // points.forEach(element => {pointsAbove.push(element)});
    // var closestBelow = L.GeometryUtil.closest(map, allPos, latlngBelow);
    // isPointOnLine(closestBelow, allPos, 0.5);
    
    // var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    // map.removeLayer(polylineBracket);
    // polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 60, opacity: 0.5}).addTo(map);

    // var dist = distance/1000;
    // var intervalMarker = 100;
    // var previousClosest = new Array();
    // var weight = 2;
    // // // var previousPoint = allPos[0];
    // while(dist >= intervalMarker){
    //     var pointDist = turf.along(itineraryJSON, intervalMarker).geometry.coordinates;
    //     isPointOnLine(L.latLng(pointDist[1], pointDist[0]), allPos, 0.5);
    //     var pointsToKeep = points.filter(n => !previousClosest.includes(n));
    //     L.polyline(pointsToKeep, {color: 'red', weight: weight, opacity: 0.5}).addTo(map);
    //     console.log(weight);
    //     weight++;
    //     pointsToKeep.forEach(element => {previousClosest.push(element)});
    //     // var marker = L.marker(L.latLng(pointDist[1], pointDist[0])).addTo(map);
    //     // marker.bindPopup("dist: " + intervalMarker + "km");

    //     intervalMarker+=100;
    // }
    // isPointOnLine(allPos[allPos.length-1], allPos, 0.5);
    // var pointsToKeep = points.filter(n => !previousClosest.includes(n));
    // L.polyline(pointsToKeep, {color: 'red', weight: weight, opacity: 0.5}).addTo(map);
    
   
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

ETAFloatingText.id="cursorText"; 

document.body.appendChild(ETAFloatingText);
var ETAFloatingTextSize=[ETAFloatingText.offsetWidth,ETAFloatingText.offsetHeight];

var bracketOpenText=document.createElement('div');
bracketOpenText.style.zIndex = 1000;
bracketOpenText.style.visibility='hidden';
bracketOpenText.id="bracketText";

var bracketCloseText=document.createElement('div');
bracketCloseText.style.zIndex = 1000;
bracketCloseText.style.visibility='hidden';
bracketCloseText.id="bracketCloseText";

var circleMarkerText=document.createElement('div');
circleMarkerText.style.zIndex = 1000;
circleMarkerText.style.visibility='hidden';
circleMarkerText.id="circleText";


document.body.appendChild(bracketOpenText);
document.body.appendChild(bracketCloseText);
document.body.appendChild(circleMarkerText);


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
    popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
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


function lineBracketsHighlight(latlngAbove, latlngBelow){
    var closestAbove = L.GeometryUtil.closest(map, allPos, latlngAbove);
    isPointOnLine(closestAbove, allPos, 0.5);
    var pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    var closestBelow = L.GeometryUtil.closest(map, allPos, latlngBelow);
    isPointOnLine(closestBelow, allPos, 0.5);
    
    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    map.removeLayer(polylineBracket);
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 60, opacity: 0.5, lineCap: 'butt'}).addTo(map);
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
    markerBracketClose.dragging.enable();
    markerBracketOpen.dragging.enable();

    

    markerBracketClose
                .on("dragend", function(e){
                    isMovingBrackets = true;
                    markerBracketClose.setLatLng(L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng()));
                    lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
                })
                .on("dragstart", function(e){
                    isMovingBrackets = true;
                })
                .on("drag", function(e){
                    var closestAbove = L.GeometryUtil.closest(map, allPos, circleMarker.getLatLng());
                    isPointOnLine(closestAbove, allPos, 0.5);
                    var pointsAbove = new Array();
                    points.forEach(element => {pointsAbove.push(element)});
                    var closestBelow = L.GeometryUtil.closest(map, allPos, L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng()));
                    isPointOnLine(closestBelow, allPos, 0.5);
                    
                    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
                    var distCircleBracket = 0;
                    for (var i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
                        distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
                    }
                    bracketCloseText.innerHTML="distance "+ (distCircleBracket/1000).toFixed(2) +" km";
                })

    
    markerBracketOpen
                .on("dragend", function(e){
                    isMovingBrackets = true;
                    markerBracketOpen.setLatLng(L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng()));
                    lineBracketsHighlight(markerBracketOpen.getLatLng(),  markerBracketClose.getLatLng());
                })
                .on("dragstart", function(e){
                    isMovingBrackets = true;
                })
                .on("drag", function(e){
                    
                    var closestAbove = L.GeometryUtil.closest(map, allPos, L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng()));
                    isPointOnLine(closestAbove, allPos, 0.5);
                    var pointsAbove = new Array();
                    points.forEach(element => {pointsAbove.push(element)});
                    var closestBelow = L.GeometryUtil.closest(map, allPos, circleMarker.getLatLng());
                    isPointOnLine(closestBelow, allPos, 0.5);
                    
                    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
                    var distCircleBracket = 0;
                    for (var i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
                        distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
                    }
                    console.log(distCircleBracket);
                    bracketOpenText.innerHTML="distance "+ (distCircleBracket/1000).toFixed(2) +" km";
                })

    // bracketOpenText.style.visibility='visible';
    bracketOpenText.innerHTML="distance "+(distAbove/1000).toFixed(2) +" km";
    bracketOpenText.style.left=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).x+20+'px';
    bracketOpenText.style.top=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).y-50+'px';

    // bracketCloseText.style.visibility='visible';
    bracketCloseText.innerHTML="distance "+(distBelow/1000).toFixed(2) +" km";
    bracketCloseText.style.left=map.latLngToContainerPoint(markerBracketClose.getLatLng()).x+20+'px';
    bracketCloseText.style.top=map.latLngToContainerPoint(markerBracketClose.getLatLng()).y-50+'px';

    // circleMarkerText.style.visibility='visible';
    circleMarkerText.innerHTML="distance " +(dist/1000).toFixed(2) + "km";
    circleMarkerText.style.left=map.latLngToContainerPoint(circleMarker.getLatLng()).x+20+'px';
    circleMarkerText.style.top=map.latLngToContainerPoint(circleMarker.getLatLng()).y-50+'px';

    isPointOnLine(latlngAbove, allPos, 0.5);
    var pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    isPointOnLine(latlngBelow, allPos, 0.5);
    
    // console.log(points);
    // console.log(pointsAbove);
    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 60, opacity: 0.5, lineCap: 'butt'}).addTo(map);

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

function moveMarkers(latlng){
    if(isMovingMarker){
        var closest = L.GeometryUtil.closest(map, allPos, latlng);
        var diff = L.latLng(circleMarker.getLatLng().lat - closest.lat, circleMarker.getLatLng().lng - closest.lng);
        circleMarker.setLatLng(L.GeometryUtil.closest(map, allPos, closest));
        circleZoneOfInterest.setLatLng(L.GeometryUtil.closest(map, allPos, closest));
        // isMovingMarker = true;
        if (markerBracketClose != null){
            markerBracketClose.setLatLng(L.GeometryUtil.closest(map, allPos, L.latLng(markerBracketClose.getLatLng().lat-diff.lat, markerBracketClose.getLatLng().lng-diff.lng)));
            markerBracketOpen.setLatLng(L.GeometryUtil.closest(map, allPos, L.latLng(markerBracketOpen.getLatLng().lat-diff.lat, markerBracketOpen.getLatLng().lng-diff.lng)));
            bracketOpenText.style.left=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).x+20+'px';
            bracketOpenText.style.top=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).y-50+'px';
        //     markerBracketOpen.setLatLng(markerBracketOpen.getLatLng()+diff);
        }
        isPointOnLine(closest, allPos, 5)
        
        points.push(closest);
        var dist = 0;
        for (var i = 0; i < points.length - 1; i++){
            dist += points[i].distanceTo(points[i+1]);
        }
        var percent = dist*100/distance;
        circleMarkerText.innerHTML="distance " + (dist/1000).toFixed(2) +"km";
    } 
}

map.on("zoomanim", function(e){
    if(markerBracketClose != null){
        bracketOpenText.style.left=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).x+20+'px';
        bracketOpenText.style.top=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).y-50+'px';
        // bracketOpenText.innerHTML="distance "+isMovingBrackets;

        bracketCloseText.style.left=map.latLngToContainerPoint(markerBracketClose.getLatLng()).x+20+'px';
        bracketCloseText.style.top=map.latLngToContainerPoint(markerBracketClose.getLatLng()).y-50+'px';
        // bracketCloseText.innerHTML="distance "+isMovingBrackets;

        circleMarkerText.style.left=map.latLngToContainerPoint(circleMarker.getLatLng()).x+20+'px';
        circleMarkerText.style.top=map.latLngToContainerPoint(circleMarker.getLatLng()).y-50+'px';
        // circleMarkerText.innerHTML="distance "+isMovingMarker;
    }
})

onpointerdown = (event) => {
    isPointerDown = true;
    //get the points
    //check if it is close to the markers
    //if close to a bracket, drag bracket
    //if close to the dot, drag interval
    // var point = L.point(event.clientX, event.clientY); //point in pixel
    // var latlng = map.containerPointToLatLng(point); //point in latlng

};

onpointermove = (event) => {
    if(markerBracketClose != null){
        bracketOpenText.style.left=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).x+20+'px';
        bracketOpenText.style.top=map.latLngToContainerPoint(markerBracketOpen.getLatLng()).y-50+'px';
        // bracketOpenText.innerHTML="distance ";

        bracketCloseText.style.left=map.latLngToContainerPoint(markerBracketClose.getLatLng()).x+20+'px';
        bracketCloseText.style.top=map.latLngToContainerPoint(markerBracketClose.getLatLng()).y-50+'px';
        // bracketCloseText.innerHTML="distance ";

        circleMarkerText.style.left=map.latLngToContainerPoint(circleMarker.getLatLng()).x+20+'px';
        circleMarkerText.style.top=map.latLngToContainerPoint(circleMarker.getLatLng()).y-50+'px';
        // circleMarkerText.innerHTML="distance ";
    
    }
    if(isPointerDown){
        moveCursor(event); //text follow mouse
        var point = L.point(event.clientX, event.clientY); //point in pixel
        var latlng = map.containerPointToLatLng(point); //point in latlng
        distancePixelPoints(latlng, point);
        if(latlng.distanceTo(circleMarker.getLatLng()) < 5000){
            isMovingMarker = true;
        }
        moveMarkers(latlng); //move the threemarkers together
    }
};

onpointerup = (event) => {
    var point = L.point(event.clientX, event.clientY);
    var latlng = map.containerPointToLatLng(point);
    var isOnMarker = true;
        if (circleMarker != null){
            if (circleMarker.getLatLng().distanceTo(latlng) < 5000){
                isOnMarker = false; 
            } 
        }
        // console.log("isonmarker circle: " + isOnMarker);
        if (markerBracketClose != null){
            if (markerBracketClose.getLatLng().distanceTo(latlng) < 5000 || markerBracketOpen.getLatLng().distanceTo(latlng) < 5000){
                isOnMarker = false;
            }
    }
    // console.log("isonmarker brackets: " + isOnMarker);
    // console.log(isMovingMarker);
    if ((isMovingMarker || isMovingBrackets) && markerBracketClose != null){
        lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
    }
    if (isPointerDown && isOnMarker && !isMovingMarker && !isMovingBrackets){
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
                    markerBracketClose = null;
                    markerBracketOpen = null;
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
            circleZoneOfInterest.on("contextmenu", dwellOnCircle);
            
            // var opl = new L.OverPassLayer({
            //     minZoom: 9, //results appear from this zoom levem
            //     query: `node(around: 5000.0, ${closest.lat}, ${closest.lng})['amenity'='restaurant'];out;`, 
            //     markerIcon : greenIcon, //custom icon
            //     minZoomIndicatorEnabled : false,
            //     onSuccess: function(data) { //doesn't work the markers don't appear
            //         for (let i = 0; i < data.elements.length; i++) {
            //             let pos;
            //             let marker;
            //             const e = data.elements[i];
                
            //             if (e.id in this._ids) {
            //               continue;
            //             }
                
            //             this._ids[e.id] = true;
                
            //             if (e.type === 'node') {
            //               pos = L.latLng(e.lat, e.lon);
            //             } else {
            //               pos = L.latLng(e.center.lat, e.center.lon);
            //             }
                
            //             if (this.options.markerIcon) {
            //               marker = L.marker(pos, { icon: this.options.markerIcon });
            //             } else {
            //               marker = L.circle(pos, 20, {
            //                 stroke: false,
            //                 fillColor: '#E54041',
            //                 fillOpacity: 0.9
            //               });
            //             }
                
            //             const popupContent = this._getPoiPopupHTML(e.tags, e.id);
            //             const popup = L.popup().setContent(popupContent);
            //             marker.bindPopup(popup);
            //             markers.push(marker);
                
            //             this._markers.addLayer(marker);
            //           }
            //         // data.elements.forEach(element => { markers.push(element); });
            //         // console.log(data);
            //     },
            //     // afterRequest: function()  {
                   
            //     // }, // we want to keep the circle
            // });
            // map.addLayer(opl);

        }
            
        
    } 
    isPointerDown = false;
    isMovingMarker = false;
    isMovingBrackets = false;
    map.dragging.enable();
    // console.log(isMovingMarker);
    
    var zoom = map.getZoom();
    // console.log(itinerary.weight + "    " + zoom);
    if (zoom > 14){
        itinerary.setStyle({weight : 10*(zoom-13)}); //keep the itinerary always bigger than road 
    } else {
        itinerary.setStyle({weight : 10});
    }
    outline.setStyle({weight:60});
}


