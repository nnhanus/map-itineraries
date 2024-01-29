var map = L.map('map').setView([52.19226,0.15216], 16);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    closePopupOnClick: false,
}).addTo(map);

var line;
var isPointerDown = false;

var routing = L.Routing.control({
    
    waypoints: [
        L.latLng(48.70973285709232, 2.1626934894717214),
        // L.latLng(48.70577272850384, 2.185514438847031)
        L.latLng(43.089068907903574, 2.6198013248458296)
    ],
    routeWhileDragging: false,
    geocoder: L.Control.Geocoder.nominatim(),
    lineOptions : {
        addWaypoints: false
    },
    routeLine: function(route, options) {
        line = L.Routing.line(route, options);
        line.eachLayer(function(l) {
            l.on("mousedown", function(e){
                isPointerDown = true;
                map.dragging.disable();
            })
            // l.on("mouseup", function(e){
            //     var marker = new L.marker(e.latlng, {icon: redIcon}, {draggable: 'true'}).addTo(map);
            //     // marker.on("dragstart", function (e){
            //     //     console.log("dragstart");
            //     // });
                
            //     isPointOnLine(e.latlng, allPos);
            //     points.push(e.latlng);
            //     var dist = 0;
            //     for (var i = 0; i < points.length - 1; i++){
            //         dist += points[i].distanceTo(points[i+1]);
            //     }
            //     var percent = dist*100/distance;
                
            //     // var inhour = hours(percent*time/100);
            //     // var inminutes = minutes(percent*time/100);
            //     // console.log(hour + ":" + min);
                
            //     marker.bindPopup("Distance from start of the route: " + (dist/1000).toFixed(2) + " km (" + percent.toFixed(1) + "%). Time on arrival : " + inHours(percent*time/100)).openPopup();
                
            //     // console.log(e);
            //     points.length = 0;

            // })
        //     l.on('mousedown touchstart', function(e) {
        //         map.dragging.disable();
        //         // dragMarker = L.marker(e.latlng, {icon: violetIcon}).addTo(map);
        //         // isPointOnLine(e.latlng, allPos);
        //         // points.push(e.latlng);
        //         // var dist = 0;
        //         // for (var i = 0; i < points.length - 1; i++){
        //         //     dist += points[i].distanceTo(points[i+1]);
        //         // }
        //         // var percent = (dist*100/distance);
        //         // dragMarker.bindPopup("Distance from start of the route: " + dist.toFixed(2) + " m (" + percent.toFixed(1) + "%); time to get there : " + toMinutes((percent*time)/100)).openPopup();
                
        //         // mouseDown = e.latlng;
        //         startDrag = true;
        //         // console.log("mouse down: " + mouseDown);
        //     });
        // //     l.on('pointerdown', function(e){
        // //         console.log("pointer down");
        // //     });
            
        // //     l.on('pointermove', function(e){
        // //         console.log("pointer move");
        // //     });
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
  
  var violetIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
var mouseDown;
var startDrag = false;
var dragMarker;

// map.on("click", function (e){
//     if (!startDrag){
//         if (!isPointOnLine(e.latlng, allPos)){
//             var closest = L.GeometryUtil.closest(map, allPos, e.latlng);
            
//             var markerOnLine = L.marker([closest.lat, closest.lng], {icon: greenIcon}).addTo(map);
//             isPointOnLine(closest, allPos);
//             points.push(e.latlng);
//             var dist = 0;
//             for (var i = 0; i < points.length - 1; i++){
//                 dist += points[i].distanceTo(points[i+1]);
//             }
//             markerOnLine.bindPopup("Distance from route: " + closest.distanceTo(e.latlng).toFixed(2) + " m. Distance from start of the route: " + dist.toFixed(2) + " m (" + (dist*100/distance).toFixed(1) + "%)").openPopup();
//         }
//         L.marker(e.latlng, {icon: redIcon}).addTo(map);
//         points.length = 0;
//     }
//     startDrag = false;
// })

// map.on("mouseup touchend", function(e){
//     isPointerDown = false;
//     map.dragging.enable();
    
//     // if(mouseDown != null){
//     //     if (!isPointOnLine(e.latlng, allPos)){
//     //         var closest = mouseDown;
            
//     //         var markerOnLine = L.marker([closest.lat, closest.lng], {icon: greenIcon}).addTo(map);
//     //         isPointOnLine(closest, allPos);
//     //         points.push(closest);
//     //         var dist = 0;
//     //         for (var i = 0; i < points.length - 1; i++){
//     //             dist += points[i].distanceTo(points[i+1]);
//     //         }
//     //         markerOnLine.bindPopup("Distance from route: " + closest.distanceTo(e.latlng).toFixed(2) + " m. Distance from start of the route: " + dist.toFixed(2) + " m (" + (dist*100/distance).toFixed(1) + "%)").openPopup();
//     //     }
//     //     L.marker(e.latlng, {icon: redIcon}).addTo(map);
//     //     points.length = 0;
//     //     mouseDown = null;
//     // }
       
// })

var allPos;
var distance;
var time;
var points = new Array();

routing.on("routesfound", function (e){
    allPos = e.routes[0].coordinates;
    distance = e.routes[0].summary.totalDistance;
    time = e.routes[0].summary.totalTime;
    
    // map.removeLayer(line);
    
    console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time));
})

function isPointOnLine(point, path) {
    points.length = 0;
    // console.log(path.length);
    for (var i = 0; i < path.length - 1; i++) {
        points.push(path[i]);
        if (L.GeometryUtil.belongsSegment(point, path[i], path[i + 1], 1.5)) {
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

// map.on('pointerdown', function(e){
//     console.log("pointer down");
// });



// addEventListener("pointerdown", (event) => {pointerIsDown = true;});
// addEventListener("pointermove", (event) => {
//     if (pointerIsDown){
//         console.log(event);
//     }
// });
// addEventListener("pointerup", (event) => {pointerIsDown = false;});
var popupdrag = L.popup(); 

map.on("mousemove", function (e){
    if(isPointerDown){
        if(isPointOnLine(e.latlng, allPos)){
            points.push(e.latlng);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            var percent = dist*100/distance;
            
            // var inhour = hours(percent*time/100);
            // var inminutes = minutes(percent*time/100);
            // console.log(hour + ":" + min);
            popupdrag
            .setLatLng(e.latlng)
            .setContent("Distance from start of the route: " + (dist/1000).toFixed(2) + " km (" + percent.toFixed(1) + "%). Time on arrival : " + inHours(percent*time/100))
            .openOn(map);
            // console.log(e);
            points.length = 0;
        }
    }
})

map.on("mouseup", function(e){
    if (isPointerDown){
        console.log(isPointerDown);
        if(isPointOnLine(e.latlng, allPos)){
            var marker = new L.marker(e.latlng, {draggable: 'false'}).addTo(map);
            marker.on("dragstart", function (e){
                console.log("dragstart");
            });
            
            points.push(e.latlng);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            var percent = dist*100/distance;
            
            marker.bindPopup("Distance from start of the route: " + (dist/1000).toFixed(2) + " km (" + percent.toFixed(1) + "%). Time on arrival : " + inHours(percent*time/100)).openPopup();
            
            // console.log(e);
            points.length = 0;
        }
        isPointerDown = false;

    }
    map.dragging.enable();
   
})
// map.on("mousedown", function(e){
//     console.log("mousedown: " + e.latlng);
// })
// map.on("dragstart", function(e){
//     console.log(map.getCenter());
// })
// map.on("dragend", function(e){
//     console.log(map.getCenter());
// })

