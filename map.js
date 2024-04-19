// import Openrouteservice from "./ors-js-client";

var map = L.map('map', {dragging: true}).setView([52.19226,0.15216], 16);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // minZoom: 10,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    closePopupOnClick: false,
}).addTo(map);


var itinerary; 
var outline;
var stroke;

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

var isMenuOn = false;
var queryZone = null;
var outlinePathHTML;

var weatherLayerGroup = null;
var isWeatherDisplayed = false;
var isFuelDisplayed = false;
var isRestaurantDisplayed = false;
var isInKM = true;
var orService;


L.Control.Layers = L.Control.extend({
    options:{
        position: 'topright'
    },
    onAdd: function(map) {
        var container = document.getElementById("layers");
        var button = document.getElementById("layersButton");
        var weatherLayer = document.getElementById("weatherLayer");
        var restaurantLayer = document.getElementById("restaurantLayer");
        var fuelLayer = document.getElementById("gasstationLayer");
        fuelLayer.onclick = function(e){
            // loadFuelDistribution();
            isochroneMinutes();
        }
        restaurantLayer.onclick = function(e){
            loadRestaurantDistribution();
        }
        weatherLayer.onclick = function(e){
            loadWeather();
        }
        button.onclick =  function(e){
            var menu = document.getElementById("listLayers");
            visibilityToggle(menu);
            // menu.style.visibility = "visible";
        };
        return container;
        
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.layers = function(opts) {
    return new L.Control.Layers(opts);
}


function visibilityToggle(element){
    if (element.style.visibility == "visible"){
        element.style.visibility = "collapse";
    } else {
        element.style.visibility = "visible";
    }

}

//Create the route
var routing = L.Routing.control({
    
    waypoints: [
        L.latLng(48.70973285709232, 2.1626934894717214),
        // L.latLng(48.70577272850384, 2.185514438847031)
        L.latLng(43.089068907903574, 2.6198013248458296)
        // L.latLng(53.55562497332884, 7.9839136794782375)
        // L.latLng(43.32361856747493, -0.3548212423438274)
    ],
    routeWhileDragging: false,
    geocoder: L.Control.Geocoder.nominatim(),
    showAlternatives: true,
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
    L.control.layers({}).addTo(map);
    allPos = e.routes[0].coordinates; //Get the points of the intinerary
    
    distance = e.routes[0].summary.totalDistance; //Get the distance of the itinerary (in meters)
    time = e.routes[0].summary.totalTime; //Get the time of the itinerary (in seconds)
    if (itinerary != null){
        map.removeLayer(itinerary);
        map.removeLayer(outline);
    }

    // console.log(document.querySelectorAll("svg.leaflet-zoom-animated"));

    stroke = L.polyline(allPos, {color: 'blue', weight: 53,className: "outline"}).addTo(map); // Draw the interaction zone
    var strokeHTML = stroke._path;
    
    outline = L.polyline(allPos, {color: 'blue', weight: 48, opacity: 0.25,className: "route"}).addTo(map); // Draw the interaction zone
    outlinePathHTML = outline._path;
    outlinePathHTML.id = "strokeRoute";
    // console.log(outlinePathHTML);

    itinerary = L.polyline(allPos, {color: 'blue', weight: 5}).addTo(map); //Draw a new polyline with the points
   
    itineraryJSON =  itinerary.toGeoJSON(); //convert the itinerary to JSON for distance purposes

    createFilterShadow();
    createFilterStroke();
    
    strokeHTML.setAttribute("filter", "url(#filterShadow)");
    strokeHTML.setAttribute("mask", "url(#strokeMask)");
    itinerary.bringToFront();

    createGradientRestaurant();
    createGradientFuel();
    // outlinePathHTML.setAttribute("stroke", "url(#gradientStroke)");

    // outlinePathHTML.setAttribute("stroke", "red");
    // createGradient();
    // strokeHTML.setAttribute("stroke", "url(#gradienStroke)");

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

    var apiKey = '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f';
    orService = new Openrouteservice.Directions({api_key : apiKey});
})

function createFilterShadow(){
    var defs = document.createElementNS("http://www.w3.org/2000/svg",'defs');
    defs.id = "defs";
    
    var filter = document.createElementNS("http://www.w3.org/2000/svg",'filter');
    filter.id = "filterShadow";
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("color-interpolation-filters", "sRGB");

    var flood = document.createElementNS("http://www.w3.org/2000/svg",'feFlood');
    flood.setAttribute("flood-opacity", "0");
    flood.setAttribute("result", "BackgroundImageFix");

    var colorMatrix1 = document.createElementNS("http://www.w3.org/2000/svg",'feColorMatrix');
    colorMatrix1.setAttribute("in", "SourceAlpha");
    colorMatrix1.setAttribute("type", "matrix");
    colorMatrix1.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    colorMatrix1.setAttribute("result", "hardAlpha");

    var offset = document.createElementNS("http://www.w3.org/2000/svg",'feOffset');
    offset.setAttribute("dy", "4");

    var gaussianBlur = document.createElementNS("http://www.w3.org/2000/svg",'feGaussianBlur');
    gaussianBlur.setAttribute("stdDeviation", "4");

    var compositeShadow = document.createElementNS("http://www.w3.org/2000/svg",'feComposite');
    compositeShadow.setAttribute("in2", "hardAlpha");
    compositeShadow.setAttribute("operator", "out");

    var colorMatrix2 = document.createElementNS("http://www.w3.org/2000/svg",'feColorMatrix');
    colorMatrix2.setAttribute("type", "matrix");
    colorMatrix2.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0");

    var blend1 = document.createElementNS("http://www.w3.org/2000/svg",'feBlend');
    blend1.setAttribute("mode", "normal");
    blend1.setAttribute("in2", "BackgroundImageFix");
    blend1.setAttribute("result", "effect1_dropShadow_269_714");

    var blend2 = document.createElementNS("http://www.w3.org/2000/svg",'feBlend');
    blend2.setAttribute("mode", "normal");
    blend2.setAttribute("in", "SourceGraphic");
    blend2.setAttribute("in2", "effect1_dropShadow_269_714");
    blend2.setAttribute("result", "shape");
    
    filter.appendChild(flood);
    filter.appendChild(colorMatrix1);
    filter.appendChild(offset);
    filter.appendChild(gaussianBlur);
    filter.appendChild(compositeShadow);
    filter.appendChild(colorMatrix2);
    filter.appendChild(blend1);
    filter.appendChild(blend2);

    defs.appendChild(filter);

    var svg = document.querySelectorAll("svg.leaflet-zoom-animated");
    svg[0].appendChild(defs);
}

function createFilterStroke(){
    //Everything under white will appear, everything thing under black will not
    var mask = document.createElementNS("http://www.w3.org/2000/svg",'mask');
    mask.id = "strokeMask";
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "1000");
    rect.setAttribute("height", "1000");
    rect.setAttribute("fill", "white");
    mask.appendChild(rect);

    var lineMask = L.polyline(allPos, {color: 'black', weight: 48, opacity: 1}).addTo(map); 
    
    var path = lineMask._path;
    path.id = "maskStrokePath";
    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-opacity", "1");
    mask.append(path);
    
    var defs = document.getElementById("defs");
    defs.appendChild(mask);
}

function createGradientRestaurant(){
    var gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    gradient.id = "gradientRestaurant";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.setAttribute("gradientUnits", "objectBoundingBox");

    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    // stop1.setAttribute("offset", "0.0");
    stop1.setAttribute("stop-color", '#0000FF');
    
    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop2.setAttribute("offset", "0.16");
    stop2.setAttribute("stop-color", "#E6E6FD");

    var stop3 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop3.setAttribute("offset", "0.29");
    stop3.setAttribute("stop-color", "#6566FF");
    
    var stop4 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop4.setAttribute("offset", "0.41");
    stop4.setAttribute("stop-color", "#D9D9ED");
    
    var stop5 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop5.setAttribute("offset", "0.58");
    stop5.setAttribute("stop-color", "#00029C");
    
    var stop6 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop6.setAttribute("offset", "0.81");
    stop6.setAttribute("stop-color", "#7173FF");
    
    var stop7 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop7.setAttribute("offset", "100%");
    stop7.setAttribute("stop-color", '#000299');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    gradient.appendChild(stop4);
    gradient.appendChild(stop5);
    gradient.appendChild(stop6);
    gradient.appendChild(stop7);

    var defs = document.getElementById("defs");
    defs.appendChild(gradient);
}

function createGradientFuel(){
    var gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    gradient.id = "gradientFuel";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.setAttribute("gradientUnits", "objectBoundingBox");

    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    // stop1.setAttribute("offset", "0.0");
    stop1.setAttribute("stop-color", '#000299');
    
    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop2.setAttribute("offset", "0.16");
    stop2.setAttribute("stop-color", "#D9D9ED");

    var stop3 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop3.setAttribute("offset", "0.22");
    stop3.setAttribute("stop-color", "#00029C");
    
    var stop4 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop4.setAttribute("offset", "0.41");
    stop4.setAttribute("stop-color", "#7173FF");
    
    var stop5 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop5.setAttribute("offset", "0.58");
    stop5.setAttribute("stop-color", "#6566FF");
    
    var stop6 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop6.setAttribute("offset", "0.81");
    stop6.setAttribute("stop-color", "#0100CC");
    
    var stop7 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop7.setAttribute("offset", "100%");
    stop7.setAttribute("stop-color", '#E6E6FD');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    gradient.appendChild(stop4);
    gradient.appendChild(stop5);
    gradient.appendChild(stop6);
    gradient.appendChild(stop7);

    var defs = document.getElementById("defs");
    defs.appendChild(gradient);
}

function isochroneMinutes(type, value){
    // try{
    //     let response = await Isochrones.calculate({
    //         locations: [[circleZoneOfInterest.getLatLng().lat, circleZoneOfInterest.getLatLng().lng]],
    //         profile: 'driving-car',
    //         range: [600],
    //         range_type: 'time'
    //     })
    //     console.log(response);
    // } catch (err){
    //     console.log("An error occurred: " + err.status);
    //     console.log(err);
    // }

    let request = new XMLHttpRequest();

    request.open('POST', "https://api.openrouteservice.org/v2/isochrones/driving-car");

    request.responseType = "json";

    request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f');

    request.onreadystatechange = function () {
    if (this.readyState === 4) {
        console.log('Status:', this.status);
        console.log('Headers:', this.getAllResponseHeaders());
        console.log('Body:', this.response);
        console.log('Body:', this.response.features[0].geometry.coordinates[0]);
        isochroneToPolygon(this.response.features, type);
    }
    };

    if (markerBracketClose != null){
        // const body = '{"locations":[[8.681495,49.41461],[8.686507,49.41943]],"range":[300,200]}';
        const body = '{"locations":[[' + markerBracketOpen.getLatLng().lng + ',' + markerBracketOpen.getLatLng().lat + '],[' + circleZoneOfInterest.getLatLng().lng + ',' + circleZoneOfInterest.getLatLng().lat +
                    '],[' + markerBracketClose.getLatLng().lng + ',' + markerBracketClose.getLatLng().lat+ ']],"profile":"driving-car","range":[' + value*60 + '],"range_type":"time"}';
                    console.log(body);
        request.send(body);
    } else {
        const body = '{"locations":[[' + circleZoneOfInterest.getLatLng().lng + ',' + circleZoneOfInterest.getLatLng().lat + ']],"profile":"driving-car","range":[' + value*60 + '],"range_type":"time"}';
                    console.log(body);
        request.send(body);

    }


    
} 


function isochroneToPolygon(body, type){
    console.log(body);
    // var coords = body[0].geometry.coordinates[0];
    body.forEach(element => {
        var coords = element.geometry.coordinates[0];
    
        var latLngs = [];
        coords.forEach(element =>{
            latLngs.push(L.latLng(element[1], element[0]));
        });
        console.log(latLngs);

        var polygon = [latLngs[0]];
        for (var i = 1; i < latLngs.length; i++){
            if (latLngs[i].distanceTo(polygon[polygon.length-1]) > 1000){
                polygon.push(latLngs[i]);
            }
        } 
        console.log(polygon);

        if (polygon.length < 350){
            L.polygon(latLngs, {color:'red'/*, className:"pulse"*/}).addTo(map);
            queryZone = L.polygon(polygon, {color:'blue'/*, className:"pulse"*/}).addTo(map);
            var queryString = arrayToQuery(polygon, type);
            oplQuery(queryString);
        } else {
            // window.alert("too long, query will fail");
            
            var polygonReduced = [polygon[0]];
            for (var i = 1; i < polygon.length; i++){
                if (polygon[i].distanceTo(polygonReduced[polygonReduced.length-1]) > 2000){
                    polygonReduced.push(polygon[i]);
                }
                
            } 
            L.polygon(latLngs, {color:'red'/*, className:"pulse"*/}).addTo(map);
            L.polygon(polygon, {color:'green'/*, className:"pulse"*/}).addTo(map);
            queryZone = L.polygon(polygonReduced, {color:'blue'/*, className:"pulse"*/}).addTo(map);
            var queryString = arrayToQuery(polygonReduced, type);
            oplQuery(queryString);
        }
    })
}

function oplQuery(queryString){
    var opl = new L.OverPassLayer({
        minZoom: 9, //results appear from this zoom levem 
        query: queryString,
        markerIcon : greenIcon, //custom icon
        minZoomIndicatorEnabled : false,
        onSuccess: function(data) { //doesn't work the markers don't appear
            // console.log(data);
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
    
                marker.on("contextmenu", function(e){
                    var container = L.DomUtil.create('div'),
                    startBtn = createButton('Add to route', container);
                    L.DomEvent.on(startBtn, 'click', function() {
                        routing.spliceWaypoints(1, 0, e.latlng);
                        map.closePopup();
                    });
    
                    L.popup({className:"popupCustom"})
                        .setContent(container)
                        .setLatLng(e.latlng)
                        .openOn(map);
                    })
    
                this._markers.addLayer(marker);
                }
                
                // console.log(queryZone._path);
            // data.elements.forEach(element => { markers.push(element); });
            // console.log(data);
        },
        onError: function(xhr){
            console.log("error");
        },
        afterRequest: function()  {
            console.log("afterRequest");
            
        } // we want to keep the circle
        });
        map.addLayer(opl);


}


// Body: {"type":"FeatureCollection","bbox":[1.470376,46.41925,1.481074,46.438904],"features":[{"type":"Feature","properties":{"group_index":0,"value":1000.0,"center":[1.4610298885531272,46.40757002482798]},"geometry":{"coordinates":[[[1.470699,46.41925],[1.470942,46.419746],[1.471185,46.420242],[1.471339,46.420624],[1.471487,46.420993],[1.471926,46.422265],[1.474727,46.427569],[1.475513,46.428658],[1.47585,46.429179],[1.476182,46.429692],[1.476504,46.430258],[1.476821,46.430815],[1.477885,46.432798],[1.478948,46.434777],[1.480011,46.436755],[1.481074,46.438734],[1.480757,46.438904],[1.479694,46.436926],[1.478631,46.434947],[1.477568,46.432968],[1.476508,46.430993],[1.474435,46.42778],[1.473643,46.426682],[1.473307,46.426156],[1.472966,46.42562],[1.472758,46.425244],[1.472543,46.424853],[1.472285,46.424256],[1.472021,46.423646],[1.470376,46.419408],[1.470699,46.41925]]],"type":"Polygon"}}],"metadata":{"attribution":"openrouteservice.org | OpenStreetMap contributors","service":"isochrones","timestamp":1713526360253,"query":{"profile":"driving-car","locations":[[1.4610299999999834,46.40757000000002]],"range":[1000.0],"range_type":"distance"},"engine":{"version":"8.0.0","build_date":"2024-03-21T13:55:54Z","graph_date":"2024-04-07T16:50:19Z"}}}
function itineraryPass(itinerary, distValue){
    
    var dist = 0;
    var polygon = [];
    var prevPoint = itinerary[0];
    var forstPoint;
    for (var i = 0; i < itinerary.length - 1; i++){
        dist += itinerary[i].distanceTo(itinerary[i+1]);
        if (dist > distValue){
            // var marker = L.marker(itinerary[i+1]).addTo(map); 
            // marker.bindPopup("dist: " + dist/1000 + "km");
            // console.log(isVertical(map.latLngToContainerPoint(prevPoint), map.latLngToContainerPoint(itinerary[i+1])));
            // var circleDist;
            if (forstPoint == null){
                forstPoint = itinerary[i+1];
            }
            // var circleColor;
            var isVerticaal = isVertical(map.latLngToContainerPoint(prevPoint), map.latLngToContainerPoint(itinerary[i+1]));
            // if (isVerticaal){
            //         circleColor = L.circle(itinerary[i+1], {radius : distValue, color: "red"}).addTo(map);
            //     } else {
            //         circleColor = L.circle(itinerary[i+1], {radius : distValue, color: "green"}).addTo(map);
            //     }
            var pointDown;
            var pointUp;
            var circleDist = L.circle(itinerary[i+1], {radius : distValue}).addTo(map);
            var circleBounds = circleDist.getBounds();
            map.removeLayer(circleDist);
            if (isVerticaal){
                pointDown = L.latLng(itinerary[i+1].lat, circleBounds.getWest());
                pointUp = L.latLng(itinerary[i+1].lat, circleBounds.getEast());
            } else {
                pointDown = L.latLng(circleBounds.getSouth(), itinerary[i+1].lng);
                pointUp = L.latLng(circleBounds.getNorth(), itinerary[i+1].lng);
            }
            
            
            polygon.splice(polygon.length/2, 0,pointDown, pointUp);
            prevPoint = itinerary[i+1];

            dist = 0;
        }
    }

    var pointDown;
    var pointUp;
    var circleDist = L.circle(itinerary[itinerary.length-1], {radius : distValue}).addTo(map);
    var circleBounds = circleDist.getBounds();
    map.removeLayer(circleDist);
    if (isVertical(map.latLngToContainerPoint(prevPoint), map.latLngToContainerPoint(itinerary[itinerary.length-1]))){
        pointDown = L.latLng(itinerary[itinerary.length-1].lat, circleBounds.getWest());
        pointUp = L.latLng(itinerary[itinerary.length-1].lat, circleBounds.getEast());
    } else {
        pointDown = L.latLng(circleBounds.getSouth(), itinerary[itinerary.length-1].lng);
        pointUp = L.latLng(circleBounds.getNorth(), itinerary[itinerary.length-1].lng);
    }
    polygon.splice(polygon.length/2, 0, pointDown, pointUp);

    var circleDist = L.circle(itinerary[0], {radius : distValue}).addTo(map);
    var circleBounds = circleDist.getBounds();
    map.removeLayer(circleDist);
    if (isVertical(map.latLngToContainerPoint(itinerary[0]), map.latLngToContainerPoint(forstPoint))){
        pointDown = L.latLng(itinerary[0].lat, circleBounds.getWest());
        pointUp = L.latLng(itinerary[0].lat, circleBounds.getEast());
    } else {
        pointDown = L.latLng(circleBounds.getSouth(), itinerary[0].lng);
        pointUp = L.latLng(circleBounds.getNorth(), itinerary[0].lng);
    }
    polygon.splice(0, 0, pointDown);
    polygon.splice(polygon.length, 0, pointUp);

    queryZone = L.polygon(polygon, {color:'blue', className:"pulse"}).addTo(map);

    return polygon;

}

function isVertical(pointA, pointB){
    if ((pointB.y - pointA.y) == 0){
        return false;
    } else {
        var coeff = (pointB.x - pointA.x)/(pointB.y - pointA.y);
        return coeff > -3 && coeff < 1;
    }
}

function latLngToJSTS(coords){
    var coordsJSTS = [];
    for(var i = 0; i < coords.length; i++){
        coordsJSTS.push(new jsts.geom.Coordinate(coords[i].lat, coords[i].lng));
    }
    return coordsJSTS;
}

function JSTStoLatLng(coords){
    var coordsLatLng = [];
    for(var i = 0; i < coords.length; i++){
        coordsLatLng.push(L.latLng(coords[i].x, coords[i].y));
    }
    return coordsLatLng;

}

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

var bracket = L.icon({
    iconUrl: 'icons/brackets.svg',
    shadowUrl: 'icons/shadow.png',

    iconSize:     [100, 45], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
});



function loadWeather(){
    var weatherSunny = L.icon({
        iconUrl: 'icons/sunny.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    var weatherRainy = L.icon({
        iconUrl: 'icons/rain.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    var weatherCloudy = L.icon({
        iconUrl: 'icons/cloud.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    var weatherWindy = L.icon({
        iconUrl: 'icons/wind.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    var weatherSnowy = L.icon({
        iconUrl: 'icons/snow.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    var weatherStormy = L.icon({
        iconUrl: 'icons/storm.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    var weatherCloudSun = L.icon({
        iconUrl: 'icons/cloudSun.svg',
        shadowUrl: 'icons/shadow.png',
    
        iconSize:     [100, 45], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [50, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
    });

    if (weatherLayerGroup == null){
        var length = allPos.length;
        // console.log(Math.floor(length*(1/8)));
        // var marker1 = L.marker(allPos[Math.floor(length*(1/8))], {icon: weatherCloudSun});
        // var marker2 = L.marker(allPos[Math.floor(length*(2/8))], {icon: weatherCloudy});
        // var marker3 = L.marker(allPos[Math.floor(length*(3/8))], {icon: weatherRainy});
        // var marker4 = L.marker(allPos[Math.floor(length*(4/8))], {icon: weatherSnowy});
        // var marker5 = L.marker(allPos[Math.floor(length*(5/8))], {icon: weatherStormy});
        // var marker6 = L.marker(allPos[Math.floor(length*(6/8))], {icon: weatherSunny});
        // var marker7 = L.marker(allPos[Math.floor(length*(7/8))], {icon: weatherWindy});

        var marker1 = L.marker(allPos[Math.floor(length*(1/8))], {icon: weatherRainy});
        var marker2 = L.marker(allPos[Math.floor(length*(2/8))], {icon: weatherCloudSun});
        var marker3 = L.marker(allPos[Math.floor(length*(3/8))], {icon: weatherCloudy});
        var marker4 = L.marker(allPos[Math.floor(length*(4/8))], {icon: weatherCloudSun});
        var marker6 = L.marker(allPos[Math.floor(length*(6/8))], {icon: weatherSunny});

        weatherLayerGroup = L.layerGroup([marker1, marker2, marker3, marker4, marker6]).addTo(map);
        isWeatherDisplayed = true;
    } else if (!isWeatherDisplayed){
        weatherLayerGroup.addTo(map);
        isWeatherDisplayed = true;
    } else {
        weatherLayerGroup.removeFrom(map);
        isWeatherDisplayed = false;
    }

}

function loadRestaurantDistribution(){
    var outlineHTML = document.getElementById("strokeRoute");
    if(isRestaurantDisplayed){
        outlineHTML.setAttribute("stroke", "blue");
        outlineHTML.setAttribute("stroke-opacity", "0.25");
        isRestaurantDisplayed = false;
    } else {
        outlineHTML.setAttribute("stroke", "url(#gradientRestaurant)");
        outlineHTML.setAttribute("stroke-opacity", "0.7");
        isRestaurantDisplayed = true;
        isFuelDisplayed = false;
    
    }
    // L.DomUtil.addClass(outlineHTML, "outlineRestaurant");
}

function loadFuelDistribution(){
    var outlineHTML = document.getElementById("strokeRoute");
    if(isFuelDisplayed){
        outlineHTML.setAttribute("stroke", "blue");
        outlineHTML.setAttribute("stroke-opacity", "0.25");
        isFuelDisplayed = false;
    } else {
        outlineHTML.setAttribute("stroke", "url(#gradientFuel)");
        outlineHTML.setAttribute("stroke-opacity", "0.7");
        isFuelDisplayed = true;
        isRestaurantDisplayed = false;
    
    }
    // L.DomUtil.addClass(outlineHTML, "outlineRestaurant");
}

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

//Draws/updates the selected part of the route
function lineBracketsHighlight(latlngAbove, latlngBelow){
    var closestAbove = L.GeometryUtil.closest(map, allPos, latlngAbove);
    isPointOnLine(closestAbove, allPos, 0.5);
    var pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    var closestBelow = L.GeometryUtil.closest(map, allPos, latlngBelow);
    isPointOnLine(closestBelow, allPos, 0.5);
    
    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    map.removeLayer(polylineBracket);
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 48, opacity: 0.5, lineCap: 'butt'}).addTo(map);

    // console.log(isVertical(map.latLngToContainerPoint(markerBracketOpen.getLatLng()), map.latLngToContainerPoint(markerBracketClose.getLatLng())));

    circleZoneOfInterest.bringToFront()
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
    var markerAbove = L.marker(latlngAbove, {icon: bracket}).addTo(map);
    // L.marker(latlngAbove).addTo(map);

    var pointBelow = turf.along(itineraryJSON, distBelow/1000).geometry.coordinates;
    var latlngBelow =  L.latLng(pointBelow[1], pointBelow[0]);
    var markerBelow = L.marker(latlngBelow, {icon: bracket}).addTo(map);
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

    // console.log(isVertical(map.latLngToContainerPoint(markerBracketOpen.getLatLng()), map.latLngToContainerPoint(markerBracketClose.getLatLng())));

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
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 48, opacity: 0.5, lineCap: 'butt'}).addTo(map);
    circleZoneOfInterest.bringToFront();

    //By distance instead of time
    // var pointAbove = turf.along(itineraryJSON, (dist/1000)-10).geometry.coordinates;
    // var latlngAbove =  L.latLng(pointAbove[1], pointAbove[0]);
    // L.marker(latlngAbove, {icon: openBracket}).addTo(map);
    // // L.marker(latlngAbove).addTo(map);

    // var pointBelow = turf.along(itineraryJSON, (dist/1000)+10).geometry.coordinates;
    // var latlngBelow =  L.latLng(pointBelow[1], pointBelow[0]);
    // L.marker(latlngBelow, {icon: closeBracket}).addTo(map);
    // // L.marker(latlngBelow).addTo(map);
    // console.log("deltaY = " + (markerBracketClose.getLatLng().lng - markerBracketOpen.getLatLng().lng) + " deltaX = " + (markerBracketClose.getLatLng().lat - markerBracketOpen.getLatLng().lat));

}

//Handles Interactions with the query menu
function openMenu(event){
    var menuDiv = document.getElementById("menu");
    // menuDiv.bringToFront();
    var restaurant = document.getElementById("restaurant");
    var gasstation = document.getElementById("gasstation");
    var supermarket = document.getElementById("supermarket");
    restaurant.onclick = function(e){console.log("click"); menuDiv.style.visibility="hidden"; openSlider("'amenity'='restaurant'")};
    gasstation.onclick = function(e){menuDiv.style.visibility="hidden"; openSlider("'amenity'='fuel'")};
    supermarket.onclick = function(e){menuDiv.style.visibility="hidden"; openSlider("'shop'='supermarket'")};
    menuDiv.style.visibility = "visible";
    var circlePos = map.latLngToContainerPoint(circleMarker.getLatLng());
    menuDiv.style.left=circlePos.x - 50 + 'px';
    menuDiv.style.top=circlePos.y - 70 +  'px';
    isMenuOn = true;
    // if (circleCreated){
        // window.alert("clicked");
    // }
    
    circleCreated = true;
}
var circleCreated = false;

function closeMenu(){
    var menuDiv = document.getElementById("menu");
    menuDiv.style.visibility="hidden";
}

//Handles Interactions with the query slider
function openSlider(type){  
    var sliderDiv = document.getElementById("slider");
    sliderDiv.style.visibility = "visible";
    var circlePos = map.latLngToContainerPoint(circleMarker.getLatLng());
    sliderDiv.style.left=circlePos.x - 65 + 'px';
    sliderDiv.style.top=circlePos.y - 150 +  'px';
    var kmButton = document.getElementById("km");
    var minButton = document.getElementById("min");
    kmButton.onclick = function(e){toggleMinKM(true)};
    minButton.onclick = function(e){toggleMinKM(false)};
    //recup la valeur du slider
    //recup le bouton clicked du menu d'avant
    var goButton = document.getElementById("go");
    goButton.onclick = function(e){clickGoButton(type)};
    
}

function toggleMinKM(isKiloMeter){
    var kmButton = document.getElementById("km");
    var minButton = document.getElementById("min");
    if (isKiloMeter){
        isInKM = true;
        kmButton.setAttribute("class", "selected");
        minButton.setAttribute("class", "unselected");
        document.getElementById("value2").setAttribute("label","15");
        document.getElementById("value3").setAttribute("label","30");
        document.getElementById("value4").setAttribute("label","45");
    } else {
        isInKM = false;
        minButton.setAttribute("class", "selected");
        kmButton.setAttribute("class", "unselected");
        document.getElementById("value2").setAttribute("label","10");
        document.getElementById("value3").setAttribute("label","20");
        document.getElementById("value4").setAttribute("label","30");
    }
    // updateSlider();
}

function updateSlider(){
    if (isInKM){
        
    } else {
        
    }
}

function clickGoButton(type){
    var sliderDiv = document.getElementById("slider");
    sliderDiv.style.visibility = "hidden";
    if (isInKM){
        makeQuery(type, getSliderValue());
    } else {
        isochroneMinutes(type, getSliderValue());
    }

}

function getSliderValue(){
    var value = document.getElementById("range").value;
    console.log(value);
    return value;
}

function moveMarkers(latlng){
    // console.log("movemarkers");
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
            // lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
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

//Builds the string for the query and makes the query
function makeQuery(type, distValue){
    var queryString = "";
    isMenuOn = false;
    var latLngCircle = circleZoneOfInterest.getLatLng();
    
    if (markerBracketOpen == null){
        queryString = "node(around:" + distValue*1000 + "," + latLngCircle.lat + "," + latLngCircle.lng + ")[" + type + "];out;";
        queryZone = L.circle(latLngCircle, {radius: distValue*1000, color: "blue", className:"pulse"}).addTo(map);

    } else {        
        var polygon = itineraryPass(polylineBracket.getLatLngs(), distValue*1000);
        queryString = arrayToQuery(polygon, type);

    }
    console.log(queryString);
    oplQuery(queryString);
}

function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

function arrayToQuery(itinerary, type){
    var queryString = "node(poly:\"";
    for (var i = 0; i < itinerary.length - 1; i++){
        queryString += itinerary[i].lat + " " + itinerary[i].lng + " ";
    }
    queryString += itinerary[itinerary.length-1].lat + " " + itinerary[itinerary.length-1].lng + "\")[" + type + "];out;";
    return queryString;
    
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
    var zoom = map.getZoom();
    
    // if (zoom > 14){
    //     itinerary.setStyle({weight : 8*(zoom-13)}); //keep the itinerary always bigger than road 
    // } else {
    //     itinerary.setStyle({weight : 8});
    // }
    // outline.setStyle({weight:48});

    if (circleZoneOfInterest != null){
        zoomMult = 2560000/(Math.pow(2,zoom+1));
        circleZoneOfInterest.setRadius(zoomMult);
        // console.log("zoom level: " + zoom + ", circle radius: " + circleZoneOfInterest.getRadius());

    }
    if (circleZoneOfInterest != null){
        var zoomMult = 2560000/(Math.pow(2,zoom));
        circleZoneOfInterest.setRadius(zoomMult);

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
        if (circleMarker != null){
            if(latlng.distanceTo(circleMarker.getLatLng()) < circleZoneOfInterest.getRadius()){
            
                isMovingMarker = true;
            }
            moveMarkers(latlng); //move the threemarkers together
        }
        
    }
};

onpointerup = (event) => {
    // console.log(event);
    // openMenu();
    // document.getElementById("menu").style.visibility = "hidden";
    // Get the pointer coords
    ETAFloatingText.style.visibility='hidden';
    var point = L.point(event.clientX, event.clientY);
    var latlng = map.containerPointToLatLng(point);
    if(!isMenuOn){
        //check if the pointer went up on the circle ùmarker or the brackets
        var isNotOnMarker = true;
        if (circleMarker != null){
            if (circleMarker.getLatLng().distanceTo(latlng) < 5000){
                isNotOnMarker = false; 
            } 
        }
        // console.log("isonmarker circle: " + isOnMarker);
        if (markerBracketClose != null){
            if (markerBracketClose.getLatLng().distanceTo(latlng) < 5000 || markerBracketOpen.getLatLng().distanceTo(latlng) < 5000){
                isNotOnMarker = false;
            }
        }
        // console.log("isonmarker brackets: " + isOnMarker);
        // console.log(isMovingMarker);

        //If we're in brackets mode the pointer went up on a marker or if we were moving markers, then we redraw the highlight because the markers moved
        if ((isMovingMarker || isMovingBrackets) && markerBracketClose != null){
            // console.log("line should be redrawn");
            lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
        }
        // console.log("isPointerDown: " + isPointerDown + " isNotOnMarker: " + isNotOnMarker + " isMovingMarker: " + !isMovingMarker + " isMovingBrackets: " + !isMovingBrackets)
        //If we're not on markers, we add a point
        if (isPointerDown && isNotOnMarker && !isMovingMarker && !isMovingBrackets){
            // console.log("we should be here hello hello");
            ETAFloatingText.style.visibility='hidden'; //no more text to tell the time and dist

            //Calculate if we're on the line or not
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
                circleClosest.on("click", openMenu);
                
                isPointOnLine(closest, allPos, 5)
                points.push(closest);
                var dist = 0;
                for (var i = 0; i < points.length - 1; i++){
                    dist += points[i].distanceTo(points[i+1]);
                }
                var percent = dist*100/distance;

                var circle = L.circle(closest, {color: 'blue', fillColor: '#2B8DFF', fillOpacity: 1, radius: 2500}).addTo(map);
                // circleCreated = false;
                
                circleZoneOfInterest = circle;    
                circleClosest.bringToFront();
                circleZoneOfInterest.on("contextmenu", dwellOnCircle);
                circleZoneOfInterest.on("click", openMenu);
                if (queryZone != null){
                    map.removeLayer(queryZone);
                    queryZone = null;
                }
            }
        } 
    }
    isPointerDown = false;
    isMovingMarker = false;
    isMovingBrackets = false;
    map.dragging.enable();
    // console.log(isMovingMarker);
    
    var zoom = map.getZoom();
    // console.log("   zoom level   " + zoom);
    if (zoom > 14){
        itinerary.setStyle({weight : 8*(zoom-13)}); //keep the itinerary always bigger than road 
    } else {
        itinerary.setStyle({weight : 8});
    }
    // closeMenu();
    // outline.setStyle({weight:48});
    // stroke.setStyle({weight:58});
    if (circleZoneOfInterest != null){
        var zoomMult = 2560000/(Math.pow(2,zoom));
        circleZoneOfInterest.setRadius(zoomMult);

    }
}


