var map = L.map('map').setView([52.19226,0.15216], 16);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var routing = L.Routing.control({
    
    waypoints: [
        L.latLng(48.70973285709232, 2.1626934894717214),
        L.latLng(48.70577272850384, 2.185514438847031)
    ],
    routeWhileDragging: false,
    geocoder: L.Control.Geocoder.nominatim(),
    lineOptions : {
        addWaypoints: false
    },
    routeLine: function(route, options) {
        var line = L.Routing.line(route, options);
        line.eachLayer(function(l) {
            l.on('mousedown', function(e) {
                map.dragging.disable();
                mouseDown = e.latlng;
                startDrag = true;
                console.log("mouse down: " + mouseDown);
            });
        });
        return line;
    }
}).addTo(map);

var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
var mouseDown;
var startDrag = false;

map.on("click", function (e){
    if (!startDrag){
        if (!isPointOnLine(e.latlng, allPos)){
            var closest = L.GeometryUtil.closest(map, allPos, e.latlng);
            var markerOnLine = L.marker([closest.lat, closest.lng], {icon: greenIcon}).addTo(map);
            isPointOnLine(closest, allPos);
            points.push(e.latlng);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            markerOnLine.bindPopup("Distance from route: " + closest.distanceTo(e.latlng).toFixed(2) + " m. Distance from start of the route: " + dist.toFixed(2) + " m (" + (dist*100/distance).toFixed(1) + "%)").openPopup();
        }
        L.marker(e.latlng, {icon: redIcon}).addTo(map);
        points.length = 0;
    }
    startDrag = false;
})

map.on("mouseup", function(e){
    map.dragging.enable();
    if(mouseDown != null){
        if (!isPointOnLine(e.latlng, allPos)){
            var closest = mouseDown;
            
            var markerOnLine = L.marker([closest.lat, closest.lng], {icon: greenIcon}).addTo(map);
            isPointOnLine(closest, allPos);
            points.push(e.latlng);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            markerOnLine.bindPopup("Distance from route: " + closest.distanceTo(e.latlng).toFixed(2) + " m. Distance from start of the route: " + dist.toFixed(2) + " m (" + (dist*100/distance).toFixed(1) + "%)").openPopup();
        }
        L.marker(e.latlng, {icon: redIcon}).addTo(map);
        points.length = 0;
        mouseDown = null;
    }
       
})

var allPos;
var distance;
var time;
var points = new Array();


routing.on("routesfound", function (e){
    allPos = e.routes[0].coordinates;
    distance = e.routes[0].summary.totalDistance;
    time = e.routes[0].summary.totalTime;
    
    console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time) + "; allpos length = " + allPos.length);
})

function isPointOnLine(point, path) {
    points.length = 0;
    for (var i = 0; i < path.length - 1; i++) {
        points.push(allPos[i]);
        if (L.GeometryUtil.belongsSegment(point, path[i], path[i + 1], 0.2)) {
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
    return toMinutes(time)/60;
}

map.on("dragend", function(e){
    console.log(e);
})