var map = L.map('map').setView([52.19226,0.15216], 16);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var routing = L.Routing.control({
    
    waypoints: [
        L.latLng(48.70973285709232, 2.1626934894717214),
        L.latLng(43.08905808334944, 2.619805863149003)
    ],
    routeWhileDragging: false,
    geocoder: L.Control.Geocoder.nominatim(),
    lineOptions : {
        addWaypoints: false
    },
    routeLine: function(route, options) {
        var line = L.Routing.line(route, options);
        // line.eachLayer(function(l) {
        //     l.on('routeselected', function(e) {
        //         console.log("mouse over");
        //     });
        // });
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
  
  

map.on("click", function (e){
    if (!isPointOnLine(e.latlng, allPos)){
        var closest = L.GeometryUtil.closest(map, allPos, e.latlng);
        var markerOnLine = L.marker([closest.lat, closest.lng], {icon: greenIcon}).addTo(map);
        isPointOnLine(closest, allPos);
        points.push(e.latlng);
        var dist = 0;
        for (var i = 0; i < points.length - 1; i++){
            dist += points[i].distanceTo(points[i+1]);
        }
        markerOnLine.bindPopup("Distance from route: " + closest.distanceTo(e.latlng).toPrecision(6) + " m. Distance from start of the route: " + dist.toPrecision(6) + " m (" + (dist*100/distance).toPrecision(3) + "%)").openPopup();
    }
    L.marker(e.latlng, {icon: redIcon}).addTo(map);
    points.length = 0;
})

var allPos;
var distance;
var time;
var points = new Array();


routing.on("routesfound", function (e){
    allPos = e.routes[0].coordinates;
    distance = e.routes[0].summary.totalDistance;
    time = e.routes[0].summary.totalTime;
    
    console.log("routesfound; dist = " + distance + " m; time = " + time + " s" + "; allpos length = " + allPos.length);
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