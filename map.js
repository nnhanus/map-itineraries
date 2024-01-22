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
        // line.eachLayer(function(l) {
        //     l.on('linetouched', function(e) {
        //         console.log("mouse over");
        //     });
        // });
        return line;
    }
}).addTo(map);

// routing.on("linetouched", function(e){
//     console.log("linetouched");
// })

map.on("click", function (e){
    console.log(isPointOnLine(e.latlng, allPos));
})
// map.on("dragstart", function (e){
//     console.log(e.target._lastCenter);
// })
map.on("dragend", function (e){
    console.log(e.target);
})
var allPos;
routing.on("routeselected", function (e){
    console.log("routeselected");
    allPos = routing._selectedRoute.coordinates;
})

function isPointOnLine(point, path) {
    for (var i = 0; i < path.length - 1; i++) {
        if (L.GeometryUtil.belongsSegment(point, path[i], path[i + 1])) {
            return true;
        }
    }
    return false;
}