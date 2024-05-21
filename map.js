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

var circleZoneOfInterest = null;
var markerBracketOpen = null;
var markerBracketClose = null;
var polylineBracket;

var isMenuOn = false;
var queryZone;
var outlinePathHTML;

var weatherLayerGroup = null;
var weatherLayerGroupLines = null;
var isWeatherDisplayed = false;
var isFuelDisplayed = false;
var isRestaurantDisplayed = false;
var isElevationDisplayed = false;
var isSupermarketDisplayed = false;
var isInKM = true;

var orService;

var prevZoom;

const width = 350;
const height = 650; 

const ppi = 269;

var requestMade = false;
var state = "itinerary";
var prevState = "itinerary";
//"itinerary" "pointPlaced" "circleMove" "openMove" "closeMove" "menu" "slider" "loadingQuery" "queryResults"

var isMovingMap = false;
var previousOpenPos;
var previousClosePos;

var startTime;
var clickOnCircle = false;
var clickOnMenu = false;
var clickOnSlider = false;
var clickOnLayer = false;

var openedMarker;
var openedPopup;

var defaultBracketRange = 1200;
var transportationMode = "car"; //"car" or "foot"

var startRoute = L.latLng(48.70973285709232, 2.1626934894717214);
var endRoute = L.latLng(47.206380448601664, -1.5645061284185262);

const coordsCar = [L.latLng(48.70973285709232, 2.1626934894717214), L.latLng(47.206380448601664, -1.5645061284185262)];
const coordsFoot = [L.latLng(43.59210153989353, 1.4447266282743285), L.latLng(43.605736609310455, 1.4460502897743588)];
const gradientPalette = ["#04055E", "#00029C", "#0000FF", "#4849EE", "#7173FF", "#C9C9E4", "#E6E6FD"]; //Darkest to Lightest

const APIKey = '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f';

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
        var elevationLayer = document.getElementById("elevationLayer");
        var redrawButton = document.getElementById("supermarketLayer");
        container.onpointerdown = function(e){
            clickOnLayer = true;
        }
        fuelLayer.onclick = function(e){
            toggleFuelDistribution();
            clickOnLayer = true;
        }
        restaurantLayer.onclick = function(e){
            toggleRestaurantDistribution();
        }
        weatherLayer.onclick = function(e){
            loadWeather();
        }
        elevationLayer.onclick = function(e){
            toggleElevationDistribution();
        }
        button.onclick =  function(e){
            var menu = document.getElementById("hiddenLayers");
            visibilityToggle(menu);
        };
        redrawButton.onclick = function(e){
            toggleSupermarketDistribution();
            // forceRedraw();
            // redrawButton.classList.add('selectedLayer');
            // switchMode();
        }
        return container;
        
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.layers = function(opts) {
    return new L.Control.Layers(opts);
}

L.Control.Mode = L.Control.extend({
    options:{
        position: 'topleft'
    },
    onAdd: function(map) {
        var container = document.getElementById("changeMode");
        let icon = document.getElementById("switchButton");
        container.onclick = function(e){
            console.log(transportationMode);
            // clickOnLayer = true;
            if(transportationMode == "car"){
                icon.setAttribute("src", "icons/walk.svg");
            } else {
                icon.setAttribute("src", "icons/drive.svg");
            }
            switchMode();
        }
        return container;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});
L.control.mode = function(opts){
    return new L.Control.Mode(opts);
}

function forceRedraw(){
    // stroke._path.style.display = "none";
    // // outlinePathHTML.style.display = "none";
    // stroke._path.style.display = "block";
    // outlinePathHTML.style.display = "block";
    // createFilterShadow();
    // createFilterStroke();
    // let strokeHTML = stroke._path;
    // strokeHTML.setAttribute("filter", "url(#filterShadow)");
    // strokeHTML.setAttribute("mask", "url(#strokeMask)");
    // itinerary.bringToFront();
    // let lineMask = L.polyline(allPos, {color: 'black', weight: 48, opacity: 1}).addTo(map); 
    
    // let oldPath = document.getElementById("maskStrokePath");
    // let path = lineMask._path;
    // path.id = "maskStrokePath";
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "1000px");
    rect.setAttribute("height", "1000px");
    rect.setAttribute("fill", "white");
    let mask = document.getElementById("strokeMask");
    // // oldPath.remove();
    // path.setAttribute("stroke", "black");
    // path.setAttribute("stroke-opacity", "1");
    mask.replaceChild(rect, mask.childNodes[0]);
    // mask.append(path);

    // mask.setAttribute("maskUnits", "objectBoundingBox");

}

function switchMode(){
    
    let fuel = document.getElementById("gasstation");
    let fuelLayer = document.getElementById("gasstationLayer");
    hideLayers();
    
    switch (transportationMode){
        case "foot":
            defaultBracketRange = 1200;
            startRoute = coordsCar[0];
            endRoute = coordsCar[1];
            transportationMode = "car";
            fuel.setAttribute("src", "icons/fuelIcon.svg");
            fuelLayer.setAttribute("src", "icons/fuelIcon.svg");
           break; 
        case "car":
            defaultBracketRange = 300;
            startRoute = coordsFoot[0];
            endRoute = coordsFoot[1];
            transportationMode = "foot";
            fuel.setAttribute("src", "icons/bakery.svg");
            fuelLayer.setAttribute("src", "icons/bakery.svg");
           break; 
    }
    console.log("WE ARE CHANGING THE STATE !!!");
    state = "itinerary";
    prevState = "itinerary";
    routing.setWaypoints([startRoute, endRoute]);

}

function hideLayers(){

    clearQueryResults();

    if (circleZoneOfInterest != null){
        map.removeLayer(circleZoneOfInterest);
        map.removeLayer(markerBracketOpen);
        map.removeLayer(markerBracketClose);
        map.removeLayer(polylineBracket);
        hideFloatingTexts();
        
    }

    isRestaurantDisplayed = true;
    toggleRestaurantDistribution();
    isFuelDisplayed = true;
    toggleFuelDistribution();
    isElevationDisplayed = true;
    toggleElevationDistribution(); 
    isSupermarketDisplayed = true;
    toggleSupermarketDistribution();

    if (isWeatherDisplayed){
        loadWeather();
    }
    weatherLayerGroup = null;

    
}
//Create the route
// var routing = L.Routing.control({
    
//     waypoints: [
//         // L.latLng(48.70973285709232, 2.1626934894717214), //660
//         // L.latLng(48.70577272850384, 2.185514438847031)
//         // L.latLng(43.089068907903574, 2.6198013248458296) //Le Bastion Lagrasse
//         // L.latLng(53.55562497332884, 7.9839136794782375) //Ammerländer Strasse
//         // L.latLng(43.32361856747493, -0.3548212423438274) // Pau
//         // L.latLng(47.206380448601664, -1.5645061284185262) //Nantes
//         startRoute, endRoute
//     ],
//     routeWhileDragging: false,
//     geocoder: L.Control.Geocoder.nominatim(),
//     showAlternatives: true,
//     lineOptions : {
//         style: [{color: 'black', opacity: 0.15, weight: 30}, {color: 'white', opacity: 0.8, weight: 20}, {color: 'red', opacity: 1, weight: 10}],
//         addWaypoints: false
        
//     },
//     routeLine: function(route, options) {
//         routing_line = L.Routing.line(route, options);
        
//         return routing_line;
//     }
// }).addTo(map);

// //Replace with itinerary and get the points, the time, and the distance
// routing.on("routesfound", function (e){
//     console.log("reroute");

//     let layerControl =  L.control.layers({}).addTo(map); //Add the layers menu to the map
//     let modeControl =  L.control.mode({}).addTo(map);
//     L.control.routing({}).addTo(map);
    

//     // allPos = e.routes[0].coordinates; //Get the points of the intinerary
//     // distance = e.routes[0].summary.totalDistance; //Get the distance of the itinerary (in meters)
//     // time = e.routes[0].summary.totalTime; //Get the time of the itinerary (in seconds)
//     // if (transportationMode == "foot"){
//     //     time = time*2.5;
//     // }
//     // var firstTime = true;
//     // if (itinerary != null){ //In case of re-route, make sure to delete evrything before adding new route
//     //     map.removeLayer(itinerary);
//     //     map.removeLayer(outline);
//     //     map.removeLayer(stroke);
//     //     firstTime = false;
//     // }

//     // stroke = L.polyline(allPos, {color: 'blue', weight: 53,className: "outline willnotrender"}).addTo(map); // Draw the interaction zone
    
//     // outline = L.polyline(allPos, {color: 'blue', weight: 48, opacity: 0.25,className: "route willnotrender"}).addTo(map); // Draw the interaction zone
//     // outlinePathHTML = outline._path;
//     // outlinePathHTML.id = "strokeRoute";
//     // outlinePathHTML.setAttribute("class", "willnotrender");

//     // itinerary = L.polyline(allPos, {color: 'blue', weight: 5, className: "itinerary"}).addTo(map); //Draw a new polyline with the points
//     // itineraryJSON =  itinerary.toGeoJSON(); //convert the itinerary to JSON for distance purposes

//     // // let HTMLIti = itinerary._path; //add interaction to delete point
//     // // HTMLIti.onclick = function(e){
//     // //     if (state == "itinerary"){
//     // //         itineraryToPointPlaced(e);
//     // //     } else if (state == "pointPlaced"){
//     // //         pointPlacedToItinerary();
//     // //     }
//     // // }

//     // let strokeHTML = stroke._path;
//     // // strokeHTML.onclick=function(e){ //add interaction to delete point
//     // //     if (state == "itinerary"){
//     // //         itineraryToPointPlaced(e);
//     // //     } else if (state == "pointPlaced"){
//     // //         pointPlacedToItinerary();
//     // //     }
//     // // }

//     // // outlinePathHTML.onclick=function(e){ //add interaction to delete point
//     // //     if (state == "itinerary"){
//     // //         itineraryToPointPlaced(e);
//     // //     } else if (state == "pointPlaced"){
//     // //         pointPlacedToItinerary();
//     // //     }
//     // // }
    
//     // if (!firstTime){
//     //     //Make sure the range markers are on the new itinerary
//     //     if (circleZoneOfInterest != null){

        
//     //         var newLatLng = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
//     //         circleZoneOfInterest.setLatLng(newLatLng);

//     //         var newLLClose = L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng());
//     //         markerBracketClose.setLatLng(newLLClose);

//     //         var newLLOpen = L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng());
//     //         markerBracketOpen.setLatLng(newLLOpen);
//     //     }

//     //     //Check if a layer is activated and if yes re-activate it
//     //     if(isElevationDisplayed){
//     //         isElevationDisplayed = false;
//     //         toggleElevationDistribution();
//     //     } else if (isFuelDisplayed){
//     //         isFuelDisplayed = false;
//     //         toggleFuelDistribution();
//     //     } else if (isRestaurantDisplayed){
//     //         isRestaurantDisplayed = false;
//     //         toggleRestaurantDistribution()
//     //     }
//     // } else {
//     //     //Create the ORS instance
//     //     // const apiKey = '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f';
//     //     orService = new Openrouteservice.Directions({api_key : APIKey});

//     //     //Create the defs section to add the filters and mask
//     //     let defs = document.createElementNS("http://www.w3.org/2000/svg",'defs');
//     //     defs.id = "defs";
//     //     var svg = document.querySelectorAll("svg.leaflet-zoom-animated");
//     //      svg[0].appendChild(defs);

//     //     createFloatingTexts(); //Creatte the cursor text and the marker text
//     // }
    
//     // //Add shadow and stroke to the itinerary
//     // createFilterShadow();
//     // createFilterStroke();
//     // strokeHTML.setAttribute("filter", "url(#filterShadow)");
//     // strokeHTML.setAttribute("mask", "url(#strokeMask)");

//     // //Load the gradients
//     // createGradientRestaurant();
//     // createGradientFuel();
//     // createGradientElevation();
//     // createGradientSupermarket();

//     // //Make sure the layers are in the right order
//     // stroke.bringToFront();
//     // outline.bringToFront();
//     // itinerary.bringToFront();

//     // // console.log("ele: " + isElevationDisplayed + ", fuel: " +  isFuelDisplayed + ", resto: " + isRestaurantDisplayed);
//     // console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time));
//     // // console.log("end of routing");
// })


L.Control.ORSRouting = L.Control.extend({
    options:{
        position: 'topright'
    },
    onAdd: function(map){
        let container = document.createElement("div");
        container.id = "routing-div";
        let input = document.createElement("input");
        input.setAttribute("type", "image");
        input.setAttribute("class", "layer");
        input.setAttribute("id", "routing-input");
        input.setAttribute("src", "icons/route.png");
        input.setAttribute("width", "22");
        input.setAttribute("height", "22");
        container.append(input);
        ORSRouting();
        // body.append(container);
        return container;
    },onRemove: function(map) {
        // Nothing to do here
    }
});
L.control.routing = function(opts){
    return new L.Control.ORSRouting(opts);
}

let routing = L.control.routing({}).addTo(map);

function ORSRouting(){
    // orService = new Openrouteservice.Directions({api_key : APIKey});
    let request = new XMLHttpRequest();

    let link = "https://api.openrouteservice.org/v2/directions/";
    if (transportationMode == "car"){
        link += "driving-car";
    } else {
        link += "foot-walking";
    }
    link += "/json";
    request.open('POST', link);

    request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', APIKey);

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            console.log('Status:', this.status);
            console.log('Headers:', this.getAllResponseHeaders());
            // console.log(JSON.parse(this.response).routes[0].geometry);
            let jsonResult = JSON.parse(this.response);
            let route = jsonResult.routes[0];
            //route.summary.distance
            //route.summary.duration
            console.log(L.Polyline.fromEncoded(route.geometry));
            routingToPolyline(route);
        }
    };

    const body = '{"coordinates":[[' + startRoute.lng + ',' + startRoute.lat +'],[' + endRoute.lng + ',' + endRoute.lat + ']], "instructions":"false"}';

    request.send(body);
}

function routingToPolyline(routeJSON){
    console.log("routing");
    let layerControl =  L.control.layers({}).addTo(map); //Add the layers menu to the map
    let modeControl =  L.control.mode({}).addTo(map);
    time = routeJSON.summary.duration;
    distance = routeJSON.summary.distance;
    let line = L.Polyline.fromEncoded(routeJSON.geometry);
    allPos = line.getLatLngs();
    var firstTime = true;
    if (itinerary != null){ //In case of re-route, make sure to delete evrything before adding new route
        map.removeLayer(itinerary);
        map.removeLayer(outline);
        map.removeLayer(stroke);
        firstTime = false;
    }

    stroke = L.polyline(allPos, {color: 'blue', weight: 53,className: "outline willnotrender"}).addTo(map); // Draw the interaction zone
    let strokeHTML = stroke._path;

    outline = L.polyline(allPos, {color: 'blue', weight: 48, opacity: 0.25,className: "route willnotrender"}).addTo(map); // Draw the interaction zone
    outlinePathHTML = outline._path;
    outlinePathHTML.id = "strokeRoute";
    outlinePathHTML.setAttribute("class", "willnotrender");

    itinerary = L.polyline(allPos, {color: 'blue', weight: 5, className: "itinerary"}).addTo(map); //Draw a new polyline with the points
    itineraryJSON =  itinerary.toGeoJSON(); //convert the itinerary to JSON for distance purposes

    map.fitBounds(stroke.getBounds());

    if (!firstTime){
        //Make sure the range markers are on the new itinerary
        if (circleZoneOfInterest != null){

        
            var newLatLng = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
            circleZoneOfInterest.setLatLng(newLatLng);

            var newLLClose = L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng());
            markerBracketClose.setLatLng(newLLClose);

            var newLLOpen = L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng());
            markerBracketOpen.setLatLng(newLLOpen);
        }

        //Check if a layer is activated and if yes re-activate it
        if(isElevationDisplayed){
            isElevationDisplayed = false;
            toggleElevationDistribution();
        } else if (isFuelDisplayed){
            isFuelDisplayed = false;
            toggleFuelDistribution();
        } else if (isRestaurantDisplayed){
            isRestaurantDisplayed = false;
            toggleRestaurantDistribution()
        }
    } else {
        //Create the ORS instance
        // const apiKey = '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f';

        //Create the defs section to add the filters and mask
        let defs = document.createElementNS("http://www.w3.org/2000/svg",'defs');
        defs.id = "defs";
        var svg = document.querySelectorAll("svg.leaflet-zoom-animated");
         svg[0].appendChild(defs);

        createFloatingTexts(); //Creatte the cursor text and the marker text
    }
    //Add shadow and stroke to the itinerary
    createFilterShadow();
    createFilterStroke();
    strokeHTML.setAttribute("filter", "url(#filterShadow)");
    strokeHTML.setAttribute("mask", "url(#strokeMask)");

    //Load the gradients
    createGradientRestaurant();
    createGradientFuel();
    createGradientElevation();
    createGradientSupermarket();

    //Make sure the layers are in the right order
    stroke.bringToFront();
    outline.bringToFront();
    itinerary.bringToFront();

    // console.log("ele: " + isElevationDisplayed + ", fuel: " +  isFuelDisplayed + ", resto: " + isRestaurantDisplayed);
    console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time));

}

/********************************************************************************
 *                    Initialize filters, gradients, & masks                    *
 ********************************************************************************/

/**
 * Creates a shadow that doesn't appear under the non-opaque outline itinerary
 */
function createFilterShadow(){
    //Delete the old filter if one exists
    const oldFilter = document.getElementById("filterShadow");
    if (oldFilter != null){
        oldFilter.remove();
    }
 
    //Create filter and set attributes
    var filter = document.createElementNS("http://www.w3.org/2000/svg",'filter');
    filter.id = "filterShadow";
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("width", width*2);
    filter.setAttribute("height", height*2);

    //This is adapted from Figma svg code export so I'm not sure what every step does
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
    
    //Add each component to the filter
    filter.appendChild(flood);
    filter.appendChild(colorMatrix1);
    filter.appendChild(offset);
    filter.appendChild(gaussianBlur);
    filter.appendChild(compositeShadow);
    filter.appendChild(colorMatrix2);
    filter.appendChild(blend1);
    filter.appendChild(blend2);
 
    //Add the filter to the defs
    var defs = document.getElementById("defs");
    defs.appendChild(filter);
}

/**
 * Adds a stroke around the outline of the itinerary
 */
function createFilterStroke(){
    //Delete the old mask if one exists
    const oldMask = document.getElementById("strokeMask");
    if(oldMask != null){
        oldMask.remove();
    }

    //Create the mask
    var mask = document.createElementNS("http://www.w3.org/2000/svg",'mask');
    mask.id = "strokeMask";
    mask.setAttribute("maskUnits", "userSpaceOnUse");

    //Everything under white will appear, everything thing under black will not
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "1000px");
    rect.setAttribute("height", "1000px");
    rect.setAttribute("fill", "white");
    mask.appendChild(rect);

    //Create a black copy of the outline to use as the mask
    var lineMask = L.polyline(allPos, {color: 'black', weight: 48, opacity: 1}).addTo(map); 
    var path = lineMask._path;
    path.id = "maskStrokePath";
    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-opacity", "1");
    mask.append(path);
    
    //Add the mask to the defs
    var defs = document.getElementById("defs");
    defs.appendChild(mask);
}

/**
 * Create a gradient for the outline of the itinerary
 */
function createGradientRestaurant(){
    //Delete the old gradient if it exists
    const oldFilter = document.getElementById("gradientRestaurant");
    if (oldFilter != null){
        oldFilter.remove();
    }

    //Create the gradient
    var gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    gradient.id = "gradientRestaurant";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.setAttribute("gradientUnits", "objectBoundingBox");

    //Create the color stops for the gradient
    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop1.setAttribute("stop-color",  gradientPalette[2]);
    
    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop2.setAttribute("offset", "0.16");
    stop2.setAttribute("stop-color", gradientPalette[6]);

    var stop3 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop3.setAttribute("offset", "0.29");
    stop3.setAttribute("stop-color", gradientPalette[4]);
    
    var stop4 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop4.setAttribute("offset", "0.41");
    stop4.setAttribute("stop-color", gradientPalette[3]);
    
    var stop5 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop5.setAttribute("offset", "0.58");
    stop5.setAttribute("stop-color", gradientPalette[1]);
    
    var stop6 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop6.setAttribute("offset", "0.81");
    stop6.setAttribute("stop-color", gradientPalette[5]);
    
    var stop7 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop7.setAttribute("offset", "100%");
    stop7.setAttribute("stop-color", gradientPalette[0]);

    //Add the coor stops to the gradient
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    gradient.appendChild(stop4);
    gradient.appendChild(stop5);
    gradient.appendChild(stop6);
    gradient.appendChild(stop7);

    //Add the gradient to the defs
    var defs = document.getElementById("defs");
    defs.appendChild(gradient);
}

/**
 * Create a gradient for the outline of the itinerary
 */
function createGradientFuel(){
    //Delete the old gradient if it exists
    const oldFilter = document.getElementById("gradientFuel");
    if (oldFilter != null){
        oldFilter.remove();
    }

    //Create the gradient
    var gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    gradient.id = "gradientFuel";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.setAttribute("gradientUnits", "objectBoundingBox");

    //Create the color stops for the gradient
    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop1.setAttribute("stop-color", gradientPalette[0]);
    
    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop2.setAttribute("offset", "0.16");
    stop2.setAttribute("stop-color", gradientPalette[4]);

    var stop3 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop3.setAttribute("offset", "0.22");
    stop3.setAttribute("stop-color", gradientPalette[1]);
    
    var stop4 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop4.setAttribute("offset", "0.41");
    stop4.setAttribute("stop-color", gradientPalette[5]);
    
    var stop5 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop5.setAttribute("offset", "0.58");
    stop5.setAttribute("stop-color", gradientPalette[4]);
    
    var stop6 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop6.setAttribute("offset", "0.81");
    stop6.setAttribute("stop-color", gradientPalette[1]);
    
    var stop7 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop7.setAttribute("offset", "100%");
    stop7.setAttribute("stop-color", gradientPalette[6]);

    //Add the coor stops to the gradient
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    gradient.appendChild(stop4);
    gradient.appendChild(stop5);
    gradient.appendChild(stop6);
    gradient.appendChild(stop7);

    //Add the gradient to the defs
    var defs = document.getElementById("defs");
    defs.appendChild(gradient);
}


/**
 * Create a gradient for the outline of the itinerary
 */
function createGradientElevation(){
    //Delete the old gradient if it exists
    const oldFilter = document.getElementById("gradientElevation");
    if (oldFilter != null){
        oldFilter.remove();
    }

    //Create the gradient
    var gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    gradient.id = "gradientElevation";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.setAttribute("gradientUnits", "objectBoundingBox");

     //Create the color stops for the gradient
    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop1.setAttribute("stop-color", gradientPalette[1]);
    
    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop2.setAttribute("offset", "0.13");
    stop2.setAttribute("stop-color", gradientPalette[3]);

    var stop3 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop3.setAttribute("offset", "0.25");
    stop3.setAttribute("stop-color", gradientPalette[4]);
    
    var stop4 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop4.setAttribute("offset", "0.37");
    stop4.setAttribute("stop-color", gradientPalette[5]);
    
    var stop5 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop5.setAttribute("offset", "0.62");
    stop5.setAttribute("stop-color", gradientPalette[6]);
    
    var stop6 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop6.setAttribute("offset", "0.75");
    stop6.setAttribute("stop-color", gradientPalette[1]);
    
    var stop7 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop7.setAttribute("offset", "100%");
    stop7.setAttribute("stop-color", gradientPalette[6]);

    //Add the coor stops to the gradient
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    gradient.appendChild(stop4);
    gradient.appendChild(stop5);
    gradient.appendChild(stop6);
    gradient.appendChild(stop7);

    //Add the gradient to the defs
    var defs = document.getElementById("defs");
    defs.appendChild(gradient);
}

function createGradientSupermarket(){
    //Delete the old gradient if it exists
    const oldFilter = document.getElementById("gradientMarket");
    if (oldFilter != null){
        oldFilter.remove();
    }

    //Create the gradient
    var gradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    gradient.id = "gradientMarket";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.setAttribute("gradientUnits", "objectBoundingBox");

     //Create the color stops for the gradient
    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop1.setAttribute("stop-color", gradientPalette[6]);
    
    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop2.setAttribute("offset", "0.13");
    stop2.setAttribute("stop-color", gradientPalette[4]);

    var stop3 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop3.setAttribute("offset", "0.25");
    stop3.setAttribute("stop-color", gradientPalette[2]);
    
    var stop4 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop4.setAttribute("offset", "0.37");
    stop4.setAttribute("stop-color", gradientPalette[1]);
    
    var stop5 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop5.setAttribute("offset", "0.62");
    stop5.setAttribute("stop-color", gradientPalette[3]);
    
    var stop6 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop6.setAttribute("offset", "0.75");
    stop6.setAttribute("stop-color", gradientPalette[5]);
    
    var stop7 = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop7.setAttribute("offset", "100%");
    stop7.setAttribute("stop-color", gradientPalette[2]);

    //Add the coor stops to the gradient
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    gradient.appendChild(stop4);
    gradient.appendChild(stop5);
    gradient.appendChild(stop6);
    gradient.appendChild(stop7);

    //Add the gradient to the defs
    var defs = document.getElementById("defs");
    defs.appendChild(gradient);
}

//Icon for POI
var greenIcon = new L.Icon({
    iconUrl: 'icons/marker_green.svg',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

//Icon for POI after being clicked
var darkGreenIcon = new L.Icon({
iconUrl: 'icons/marker_dark_green.svg',
shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowSize: [41, 41]
});

//Icon for range markers
var bracket = L.icon({
    iconUrl: 'icons/circle-marker.svg',
    shadowUrl: 'icons/shadow_circle.svg',

    iconSize:     [70, 50], // size of the icon
    shadowSize:   [70, 50], // size of the shadow
    iconAnchor:   [35, 25], // point of the icon which will correspond to marker's location
    shadowAnchor: [35, 21],  // the same for the shadow
    popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
});

//Greyed Icons for range markers
var bracketGreyed = L.icon({
    iconUrl: 'icons/circle-marker-greyed.svg',
    shadowUrl: 'icons/shadow_circle.svg',

    iconSize:     [70, 50], // size of the icon
    shadowSize:   [70, 50], // size of the shadow
    iconAnchor:   [35, 25], // point of the icon which will correspond to marker's location
    shadowAnchor: [35, 21],  // the same for the shadow
    popupAnchor:  [120, 50] // point from which the popup should open relative to the iconAnchor
});

/********************************************************************************
 *                            Isochrone & POI Queries                           *
 ********************************************************************************/

/**
 * Send isochrone query to ORS
 * @param {string} type 
 * @param {number} value 
 * @param {string} units 
 */
function isochroneMinutes(type, value, units){
    var points = getNeededPoints(polylineBracket.getLatLngs(), value, units); //Get all the points
    L.DomUtil.addClass(circleZoneOfInterest._path, "pulse"); //Circle pulse to indicate query is happening
    // console.log(points);
    if (points.length < 6){ // 5 points limit on the query
        var resIso = [];
        for (var i = 0; i < points.length; i++){
            let request = new XMLHttpRequest();

            let src = "https://api.openrouteservice.org/v2/isochrones/driving-car";
            if (transportationMode == "foot"){
                src = "https://api.openrouteservice.org/v2/isochrones/foot-walking"
            }
            request.open('POST', src);

            request.responseType = "json";

            request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
            request.setRequestHeader('Content-Type', 'application/json');
            request.setRequestHeader('Authorization', APIKey);//API key

            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    console.log('Status:', this.status);
                    console.log('Headers:', this.getAllResponseHeaders());
                    console.log('Body:', this.response);
                    resIso.push(this.response.features);
                    // console.log("i : " + i + ", length : " + points.length);
                    // console.log(resIso);
                    
                    isochroneToPolygon(resIso, type, points.length); 
                }
            };

            const body = makeIsoQuery(points[i], value, units);
            console.log(body);
            request.send(body);
        }
        console.log(resIso); 
    } else {
        window.alert("Too many points do you really need 25 points???");
    }
} 

// `let request = new XMLHttpRequest();

// request.open('POST', "https://api.openrouteservice.org/v2/isochrones/driving-car");

// request.responseType = "json";

// request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
// request.setRequestHeader('Content-Type', 'application/json');
// request.setRequestHeader('Authorization', '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f');//API key

// request.onreadystatechange = function () {
//     if (this.readyState === 4) {
//         console.log('Status:', this.status);
//         console.log('Headers:', this.getAllResponseHeaders());
//         console.log('Body:', this.response);
//     }
// };

// const body = '{"locations":[[1.06571,48.23889],[0.87957,48.20013],[0.70104,48.15214],[0.52317,48.09511],[0.3454,48.05335]],"profile":"driving-car","range":[20000],"range_type":"distance"}';
// console.log(body);
// request.send(body);`

//{"locations":[[1.06571,48.23889],[0.87957,48.20013],[0.70104,48.15214],[0.52317,48.09511],[0.3454,48.05335]],"profile":"driving-car","range":[20000],"range_type":"distance"}

/**
 * Calculates the points on which to query for isochrones based on the slider value
 * @param {L.LatLng[]} itinerary 
 * @param {number} value 
 * @param {string} units 
 * @returns {L.LatLng[]} the points on which to query
 */
function getNeededPoints(itinerary, value, units){
    //Set the distance between each points (in meters)
    var distValue;
    if (units == "distance"){
        distValue = value*1000*0.7;
    } else {
        if (transportationMode == "foot"){
            distValue = Math.floor(((value*1000*5)/36)/2); //Considering km/h walking speed
        } else {
            distValue = Math.floor(((value*1000*110)/36)/2); //Considering 110km/h car speed
        }
        
    }
    console.log(distValue);

    var polygons = [];
    var polygon = [itinerary[0]]; //the 1st point is the 1st point of the route (so the marker open)
    var prevPoint = itinerary[0];
    // L.circle(itinerary[0], {radius:50, color:"red"}).addTo(map);

    for (var i = 1; i < itinerary.length - 1 ; i++){
        dist = itinerary[i].distanceTo(prevPoint);
        if (dist > distValue){
            polygon.push(itinerary[i]);
            prevPoint = itinerary[i];
            // L.circle(itinerary[i], {radius:50, color:"red"}).addTo(map);
            //Query limit of 5 points so we split the points into arrays with length 5
            if (polygon.length > 4){
                var poly = [];
                polygon.forEach(element => {
                    poly.push(element);
                });
                polygon.length = 0;
                polygons.push(poly);
            }
        }
    }
    polygon.push(itinerary[itinerary.length-1]); //the last point is the last point of the rout (so the marker close)
    // L.circle(itinerary[itinerary.length-1], {radius:50, color:"red"}).addTo(map);
    polygons.push(polygon); 
    
    // console.log(poly);
    return polygons;
}

/**
 * Build the string query for the isochrone
 * @param {L.LatLng[]} points 
 * @param {number} value 
 * @param {string} units 
 * @returns 
 */
function makeIsoQuery(points, value, units){
    var queryString = '{"locations":[[';
    
    for (var i = 0; i < points.length-1; i++){
        queryString+= points[i].lng + ',' + points[i].lat + '],['; //Add each point
    }
    queryString+= points[points.length-1].lng + ',' + points[points.length-1].lat + ']],'+ '"range":[';
    
    //Unit conversions 
    if (units == "distance"){
        queryString+= value*1000;
    } else {
        queryString+= value*60;
    }
    queryString+= '],"range_type":"' + units + '"}';
    console.log(queryString);
    return queryString;
}

/**
 * Turn isochrone query result into a leaflet polygon
 * @param {Array} body result
 * @param {string} type type of POI
 * @param {number} length the expected length of the result
 * Called after each request so when there are diff requests for one (because more than 5 points), we need to know the expected length
 */
function isochroneToPolygon(body, type, length){
    console.log(body);
    if (body.length == length){ //Check if it is the right length
        // console.log("long enough");
        L.DomUtil.removeClass(circleZoneOfInterest._path, "pulse");
        var polygons = []; //list of all the polygons from the results
        body.forEach(layerOne => { //each element has its own polygon
            layerOne.forEach(element => {
                var coords = element.geometry.coordinates[0];
                var latLngs = [];
                coords.forEach(element =>{
                    latLngs.push(L.latLng(element[1], element[0])); //Leaflet uses LatLng and OSR uses LngLat
                });
                console.log(latLngs);
                
                //Create a polygon with the latlng and add it to the list
                var qZone = L.polygon(latLngs, {color:'green'}).addTo(map);
                polygons.push(qZone.toGeoJSON());
                map.removeLayer(qZone);
            });
        });

        //Merge all the polygons into one
        var union = polygons[0];
        for (var i =  1; i < polygons.length; i++){
            var unionTmp = turf.union(union, polygons[i]);
            union = unionTmp;
        }
        var polyUnion = L.polygon(polygonToLatLng(union.geometry.coordinates[0]), {color: 'red'}).addTo(map);
        
        //For a clean stop at the range limit
        // var circleClose = L.circle(markerBracketClose.getLatLng(), {radius: 200000}).addTo(map);
        // var boundsClose = circleClose.getBounds();
        // map.removeLayer(circleClose);
        // var westClose = boundsClose.getWest();
        // var boundsRectClose = L.latLngBounds(L.latLng(markerBracketClose.getLatLng().lat, westClose), boundsClose.getSouthEast());
        // var rectangleClose = L.rectangle(boundsRectClose).addTo(map);

        // var rectCloseJSON = rectangleClose.toGeoJSON();
        // var diffClose = turf.difference(union, rectCloseJSON);

        // var circleOpen = L.circle(markerBracketOpen.getLatLng(), {radius: 200000}).addTo(map);
        // var boundsOpen = circleOpen.getBounds();
        // map.removeLayer(circleOpen);
        // var eastOpen = boundsOpen.getEast();
        // var boundsRectOpen = L.latLngBounds(boundsOpen.getNorthWest(), L.latLng(markerBracketOpen.getLatLng().lat, eastOpen));
        // var rectangleOpen = L.rectangle(boundsRectOpen).addTo(map);

        // var rectOpenJSON = rectangleOpen.toGeoJSON();
        // var diff = turf.difference(diffClose, rectOpenJSON);

        //LatLng
        var polyLatLngs = polygonToLatLng(union.geometry.coordinates[0]);
        console.log("polygon length before simplify: " + polyLatLngs.length);

        //Simplify : Overpass Request have a size limit
        //Simplify takes point in pixels so conversion
        var line = latLngToPoint(polyLatLngs);
        var polygonXY = line;
        
        var simpMult = 1;
        while (polygonXY.length > 200){
            polygonXY = L.LineUtil.simplify(line, simpMult);
            simpMult++;
        }
        var polygon = pointToLatLng(polygonXY); //Put it back in LatLng
        console.log("polygon length after simplify: " + polygon.length);

        //polygon
        var realZone = L.polygon(polygon, {color: 'blue', className:"pulse"}).addTo(map);
        queryZone = realZone; 

        
        // map.removeLayer(rectangleClose);
        // map.removeLayer(rectangleOpen);
        map.removeLayer(polyUnion); //remove uneeded layers

        if (polygon.length > 3){
            requestMade = true;
            var queryString = arrayToQuery(polygon, type); //turn the polygon into a string
            oplQuery(queryString); //make the query
        } else {
            //Sometimes the simplification doesn't work
            //Go back to pointPlaced
            window.alert("Not Enough Points");
            state = "itinerary";
            prevState = "itinerary";
            
            if (!isFuelDisplayed && !isRestaurantDisplayed){
            outline.setStyle({color:"blue"});
            }
            itinerary.setStyle({color:"blue"});
            stroke.setStyle({color:"blue"});

            hideFloatingTexts();

            markerBracketOpen.dragging.enable();
            markerBracketClose.dragging.enable(); 
            markerBracketOpen.setIcon(bracket);
            markerBracketClose.setIcon(bracket);    
        }

    // console.log(polyLatLngs);
    } else {
        console.log("not long enough");
    }
}

/**
 * Array from LngLat to LatLng
 * @param {L.LngLat[]} line 
 * @returns LatLng[]
 */
function polygonToLatLng(line){
    // console.log(line);
    var polygon = [];
    line.forEach(element => {
        polygon.push(L.latLng(element[1], element[0]));
    });
    // console.log(polygon);
    return polygon;
}

/**
 * Sends the Overpass Query using Leaflet Overpass Layer
 * @param {string} queryString 
 */
function oplQuery(queryString){
    console.log("oplQuery");
    console.log(queryString);
    var opl = new L.OverPassLayer({
        minZoom: 9, //results appear from this zoom levem 
        query: queryString,
        endPoint: "https://mapitin.lisn.upsaclay.fr/api/",
        markerIcon : greenIcon, //custom icon
        minZoomIndicatorEnabled : false,
        onSuccess: function(data) { 
            console.log("ON SUCCESS");
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
        
                //Add Add to Route button to the PopUp
                const popupContent = this._getPoiPopupHTML(e.tags, e.id);
                startBtn = createButton('Add to route', popupContent);
                L.DomEvent.on(startBtn, 'click', function() { //On click of button
                    routing.spliceWaypoints(1, 0, marker.getLatLng()); //Add waypoint to route and reroute
                    map.closePopup();
                });

                //Create Preview Route button
                previewBtn = createButton('Preview route', popupContent);
                
                //Create Popup
                const popup = L.popup().setContent(popupContent);
                marker.bindPopup(popup);
                markers.push(marker); //Add marker to markers list
                
                L.DomEvent.on(previewBtn, 'click', function() { //On click of preview button
                    routing.spliceWaypoints(1, 0, marker.getLatLng()); //Add waypoint to route and reroute
                    //Create new popup
                    const container =  L.DomUtil.create('div');
                    const okButton = createButton("Add to route", container);
                    L.DomEvent.on(okButton, 'click', function() {
                        //Reaplce popup with original one
                        openedMarker.unbindPopup();
                        openedMarker.bindPopup(openedPopup);
                        map.closePopup();
                    });
                    const cancelButton = createButton("Cancel", container);
                    L.DomEvent.on(cancelButton, 'click', function() {
                        map.closePopup();
                        routing.spliceWaypoints(1, 1); //Remove waypoint from the route and reroute
                        //replace popup with original
                        openedMarker.unbindPopup();
                        openedMarker.bindPopup(openedPopup);
                        
                    });
                    const popup = L.popup({closeOnClick:false,closeButton:false}).setContent(container); //Create preview popup: can't close it except by clicking on the button
                    openedMarker.unbindPopup(openedPopup);
                    openedMarker.bindPopup(popup);
                    openedMarker.openPopup();
                    
                });

                marker
                    .on("popupopen", function(e){
                        hideFloatingTexts(); //Hide marker text when popup open
                    })
                    .on("popupclose", function(e){
                        showFloatingTexts(); //SHow marker text when popup is closed
                    })
                    .on("click", function(e){
                        marker.setIcon(darkGreenIcon); //Change icon when closed
                        openedMarker = marker;
                        openedPopup = marker.getPopup();
                    })
    
                this._markers.addLayer(marker); //Add to map
                
            }
            console.log("WE ARE SETTING THE STATE TO RESULTS");
            state = "queryResults";
        },
        onError: function(xhr){
            console.log("error");
        },
        afterRequest: function()  {
            console.log("afterRequest");
            //Replace pulsing queryZone with non pulsing one
            // map.removeLayer(queryZone);
            // var nZone = L.polygon(queryZone.getLatLngs(), {fillColor: '#1b1bff', fillOpacity: 0.4, opacity:0}).addTo(map);
            
            // queryZone = nZone;
            // queryZone._path.removeClass("pulse");
            L.DomUtil.removeClass(queryZone._path, "pulse");
            queryZone.setStyle({opacity:0, fillOpacity: 0.4, fillColor: '#1b1bff'});
            
            
            polylineBracket.setStyle({opacity:0}); //Hide highlight polyline
            makeClearButton(); //Add button to clear  query result
        } 
        });
        map.addLayer(opl);

}

/**
 * Takes an array of LatLng and turns it into a OPL query
 * @param {L.LatLng[]} itinerary 
 * @param {string} type 
 * @returns {string}
 */
function arrayToQuery(itinerary, type){
    var queryString = "node(poly:\"";
    for (var i = 0; i < itinerary.length - 1; i++){
        queryString += itinerary[i].lat + " " + itinerary[i].lng + " ";
    }
    queryString += itinerary[itinerary.length-1].lat + " " + itinerary[itinerary.length-1].lng + "\")[" + type + "];out;";
    return queryString;
    
}

/********************************************************************************
 *                                Changing State                                *
 ********************************************************************************/

/**
 * Create the clear result button
 */
function makeClearButton(){
    var button = document.getElementById("clearDiv");
    button.style.visibility = "visible";
    button.onclick = function(e){clearQueryResults()};
    document.body.appendChild(button);
}

/**
 * Go from queryResult to pointPlaced state
 */
function clearQueryResults(){
    //Remove all the markers
    markers.forEach(element => {
        map.removeLayer(element);
    });
    markers.length = 0;

    //Range markers become blue again and re-enable interactions
    if (circleZoneOfInterest != null){
        circleZoneOfInterest.setStyle({color: "blue", fillColor: "#2B8DFF"});
        markerBracketOpen.setIcon(bracket);
        markerBracketClose.setIcon(bracket);
        if (map.hasLayer(markerBracketOpen) && map.hasLayer(markerBracketClose)){
            markerBracketOpen.dragging.enable();
            markerBracketClose.dragging.enable();     
        }
        

    //Higlight polyline becomes visible again
    lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
    polylineBracket.setStyle({opacity:0.5});
    }

    if (queryZone != null){
    map.removeLayer(queryZone);//remove the query zone
    }
    //Remove the clear button
    var button = document.getElementById("clearDiv");
    button.style.visibility = 'hidden';

    state = "pointPlaced";
    prevState = "pointPlaced";

    // hideFloatingTexts();
}

/**
 * Disable interactions with the range markers, and gray them out
 */
function disableCircle(){
    circleZoneOfInterest.setStyle({color: "#6D6D6D", fillColor: "#A9A9A9"});
    markerBracketOpen.setIcon(bracketGreyed);
    markerBracketClose.setIcon(bracketGreyed);

    markerBracketOpen.dragging.disable();
    markerBracketClose.dragging.disable();
}

/**
 * Revert from pointPlaced state to Itinerary state
 * @param {L.LatLng} latlng 
 * @param {L.Point} point 
 */
function pointPlacedToItinerary(latlng, point){
    var distFromLine = getDistanceInCM(latlng, point, allPos);
    var closest = L.GeometryUtil.closest(map, allPos, latlng);
    var closestPixel = toPixels(closest);
    if (distFromLine < 0.3 || distFromLine < 0.8 && closestPixel.x < point.x ){
        let distFromHighlight = getDistanceInCM(latlng, point, polylineBracket.getLatLngs());
        if (distFromHighlight > 0.3 || distFromHighlight > 10 && closestPixel.y < point.y){
        console.log("iti click");
        state = "itinerary";
        prevState = "itinerary";

        //Remove markers, highlight polyline, & markers' texts
        map.removeLayer(circleZoneOfInterest);
        map.removeLayer(markerBracketOpen);
        map.removeLayer(markerBracketClose);
        map.removeLayer(polylineBracket);
        hideFloatingTexts();

        //Change back to colored itinerary
        itinerary.setStyle({color:"blue"});
        stroke.setStyle({color:"blue"});
        outline.setStyle({color:"blue"});

        //If a layer was applied, re-apply it
        if(isElevationDisplayed){
            isElevationDisplayed = false;
            toggleElevationDistribution();
        } else if (isFuelDisplayed){
            isFuelDisplayed = false;
            toggleFuelDistribution();
        } else if (isRestaurantDisplayed){
            isRestaurantDisplayed = false;
            toggleRestaurantDistribution()
        
        }
    }
    }
}

/**
 * Change from Itinerary state to Point Placed state
 * @param {L.LatLng} latlng 
 * @param {L.Point} point 
 */
function itineraryToPointPlaced(latlng, point){
    console.log("iti");
    // let latlng = e.latlng;
    // let point = toPixels(latlng);
    console.log("pointer down : " + isPointerDown + ", !movingbrackets: " + !isMovingBrackets + ", !movemarker: " + !isMovingMarker + ", !clickLayer: " + !clickOnLayer);
    if (isPointerDown  && !isMovingMarker && !isMovingBrackets && !clickOnLayer){
        let ETAFloatingText = document.getElementById("cursorText");
        ETAFloatingText.style.visibility='hidden'; //no more text to tell the time and dist

        //Calculate if we're on the line or not
        var distFromLine = getDistanceInCM(latlng, point, allPos);
        var closest = L.GeometryUtil.closest(map, allPos, latlng);
        var closestPixel = toPixels(closest);
        if (distFromLine < 0.3 || distFromLine < 0.8 && closestPixel.x < point.x ){
            var closest = L.GeometryUtil.closest(map, allPos, latlng);
            if (circleZoneOfInterest != null){
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
            
            // circleMarker = circleClosest;

            isPointOnLine(closest, allPos, 5)
            points.push(closest);
            var dist = 0;
            for (var i = 0; i < points.length - 1; i++){
                dist += points[i].distanceTo(points[i+1]);
            }
            var percent = dist*100/distance;

            var circle = L.circle(closest, {color: 'blue', fillColor: '#2B8DFF', fillOpacity: 1, radius: 1500}).addTo(map);
            // circleCreated = false;
            
            circleZoneOfInterest = circle; 
            circleZoneOfInterest.bringToFront();   
            // circleClosest.bringToFront();
            createBrackets(latlng);
            // circleZoneOfInterest.dragging.enable()

            var circleHTML = circleZoneOfInterest._path;
            circleHTML.onclick = function(e){openMenu()};
            circleHTML.onpointerdown = function(e){clickOnCircle = true};
            if (queryZone != null){
                map.removeLayer(queryZone);
            }
            
            
        if (!isFuelDisplayed && !isRestaurantDisplayed && !isElevationDisplayed){
            outline.setStyle({color:"#000167"});
        }
            itinerary.setStyle({color:"#6D6D6D"});
            stroke.setStyle({color:"#6D6D6D"});
            state = "pointPlaced";
            prevState = "pointPlaced";
        }
    } 
}

/**
 * Handles Interactions with the query menu
 * @param {PointerEvent} event 
 */
function openMenu(event){
    console.log(state);
    if (state == "pointPlaced"){
        state = "menu";
        var menuDiv = document.getElementById("menu");
        menuDiv.onpointerdown = function(e){console.log("menu OnPointerDown"); clickOnMenu = true};
        // menuDiv.bringToFront();
        var restaurant = document.getElementById("restaurant");
        var gasstation = document.getElementById("gasstation");
        var supermarket = document.getElementById("supermarket");
        restaurant.onclick = function(e){console.log("click"); closeMenu(); openSlider("'amenity'='restaurant'")};
        gasstation.onclick = function(e){
            menuDiv.style.visibility="hidden"; 
            let type = "'amenity'='fuel'";
            if (transportationMode == "foot"){
                type = "'shop'='bakery'"
            }
            openSlider(type)};
        supermarket.onclick = function(e){menuDiv.style.visibility="hidden"; openSlider("'shop'='supermarket'")};
        menuDiv.style.visibility = "visible";
        var circlePos = toPixels(circleZoneOfInterest.getLatLng());
        var top = circlePos.y - 70;
        // console.log()
        if (top < 5){
            top = circlePos.y + 50;
        }
        menuDiv.style.left=circlePos.x - 50 + 'px';
        menuDiv.style.top=top +  'px';
        isMenuOn = true;
        // if (circleCreated){
            // window.alert("clicked");
        // }
        
    } else if (state == "circleMove" || state == "openMove" || state == "closeMove"){
        state = prevState;
    }
}

/**
 * Closes the menu
 */
function closeMenu(){
    var menuDiv = document.getElementById("menu");
    menuDiv.style.visibility="hidden";
    clickOnMenu = false;
}

/********************************************************************************
 *                                    Slider                                    *
 ********************************************************************************/

/**
 * Handles Interactions with the query slider
 * @param {PointerEvent} type 
 */
function openSlider(type){  
    if (state == "menu"){
    state = "slider";
    closeMenu();
    var sliderDiv = document.getElementById("slider");
    var value = document.getElementById("value");
    var range = document.getElementById("range");            
    setSliderMinMax(true, range);
    // getDistPolyLine(polylineBracket.getLatLngs());
    sliderDiv.addEventListener("input", (event) => {
        value.textContent = event.target.value;
      });
    sliderDiv.onpointerdown = function(e){clickOnSlider = true};
    range.onclick = function(e){console.log("onPointerUp"); clickOnSlider = false};
    // sliderDiv.onpointerup = function(e){clickOnSlider = false};
    sliderDiv.style.visibility = "visible";
    var circlePos = toPixels(circleZoneOfInterest.getLatLng());
    var top = circlePos.y - 150;
    if (top < 5){
        top+=200;
    }
    sliderDiv.style.left=circlePos.x - 65 + 'px';
    sliderDiv.style.top=top +  'px';
    var kmButton = document.getElementById("km");
    var minButton = document.getElementById("min");
    kmButton.onclick = function(e){toggleMinKM(true)};
    minButton.onclick = function(e){toggleMinKM(false)};
    //recup la valeur du slider
    //recup le bouton clicked du menu d'avant
    var goButton = document.getElementById("go");
    goButton.onclick = function(e){clickGoButton(type)};
}else if (state == "circleMove" || state == "openMove" || state == "closeMove"){
    state = prevState;
}
    
}

/**
 * Toggle between units for the slider
 * @param {boolean} isKiloMeter 
 */
function toggleMinKM(isKiloMeter){
    var kmButton = document.getElementById("km");
    var minButton = document.getElementById("min");
    var range = document.getElementById("range");
    clickOnSlider = false;
    setSliderMinMax(isKiloMeter, range);
    if (isKiloMeter){
        isInKM = true;
        kmButton.setAttribute("class", "selected");
        minButton.setAttribute("class", "unselected");
        // document.getElementById("value2").setAttribute("label","15");
        // document.getElementById("value3").setAttribute("label","30");
        // document.getElementById("value4").setAttribute("label","45");
    } else {
        isInKM = false;
        minButton.setAttribute("class", "selected");
        kmButton.setAttribute("class", "unselected");
        // document.getElementById("value2").setAttribute("label","10");
        // document.getElementById("value3").setAttribute("label","20");
        // document.getElementById("value4").setAttribute("label","30");
    }
    // updateSlider();
}

/**
 * Set the min and max value of the slider according to the range
 * @param {boolean} isKiloMeter 
 * @param {HTMLElement} slider 
 */
function setSliderMinMax(isKiloMeter, slider){
    var value = getDistPolyLine(polylineBracket.getLatLngs());
    slider.setAttribute("step", 1);
    if (isKiloMeter){
        if (transportationMode == "foot"){
            slider.setAttribute("step", 0.1);
        }
        var min = Math.round(value/5);
        if (value > 50){
            value = 50;
            min = 20;
        }
        slider.setAttribute("min", min);
        slider.setAttribute("max", value);
        console.log(value/10);
        console.log(value/3);
    } else {
        console.log("value" + value);
        var percent = (100*value)/(distance/1000);
        console.log("percent" + percent);
        var percTime = (percent*time )/100;
        console.log("% time" + percTime);
        var inMinutes = Math.round(percTime/60);
        console.log("minutes" + inMinutes);
        // console.log(time);
        // console.log(percent);
        // console.log(percTime);
        var min = Math.round(inMinutes/5);
        var max = Math.round(inMinutes);
        if (max > 60){
            max = 60;
            min = 40;
        }
        slider.setAttribute("min", min);
        slider.setAttribute("max", max);
        console.log(Math.round(inMinutes/5));
        console.log(Math.round(inMinutes));

    }
}

/**
 * Calculate the total distance of the route in km
 * @param {L.LatLng[]} route 
 * @returns {number}
 */
function getDistPolyLine(route){
    var dist = 0;
    for (var i = 0; i < route.length - 1; i++){
        dist += route[i].distanceTo(route[i+1]);
    }
    console.log(Math.round(dist/1000));
    return Math.round(dist/1000);

}

/**
 * Handles click on the Go button: starts the isochrone query
 * @param {string} type 
 */
function clickGoButton(type){
    state = "loadingQuery";
    var sliderDiv = document.getElementById("slider");
    disableCircle();
    sliderDiv.style.visibility = "hidden";
    clickOnSlider = false;
    if (isInKM){
        // makeQuery(type, getSliderValue());
        isochroneMinutes(type, getSliderValue(), "distance");
    } else {
        isochroneMinutes(type, getSliderValue(), "time");
    }

}

/**
 * Returns the current value of the slider
 * @returns {number}
 */
function getSliderValue(){
    var value = document.getElementById("range").value;
    console.log(value);
    return value;
}

/********************************************************************************
 *                                Layer Handlers                                *
 ********************************************************************************/

/**
 * Toggle Weather layer and load all needed icons
 */
function loadWeather(){
    //Load all the icons
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

    //Create the layer for the first time
    if (weatherLayerGroup == null){
        var length = allPos.length;

        var marker1 = L.marker(getWeatherPos(allPos[Math.floor(length*(1/8))], 1), {icon: weatherRainy});
        var marker2 = L.marker(getWeatherPos(allPos[Math.floor(length*(2/8))], 2), {icon: weatherCloudSun});
        var marker3 = L.marker(getWeatherPos(allPos[Math.floor(length*(3/8))], 3), {icon: weatherCloudy});
        var marker4 = L.marker(getWeatherPos(allPos[Math.floor(length*(6/8))], 6), {icon: weatherCloudSun});
        var marker6 = L.marker(getWeatherPos(allPos[Math.floor(length*(7/8))], 7), {icon: weatherSunny});

        var line1 = L.polyline([marker1.getLatLng(), allPos[Math.floor(length*(1/8))]], {color:"black", weigth:1}).addTo(map);
        var line2 = L.polyline([marker2.getLatLng(), allPos[Math.floor(length*(2/8))]], {color:"black", weigth:1}).addTo(map);
        var line3 = L.polyline([marker3.getLatLng(), allPos[Math.floor(length*(3/8))]], {color:"black", weigth:1}).addTo(map);
        var line4 = L.polyline([marker4.getLatLng(), allPos[Math.floor(length*(6/8))]], {color:"black", weigth:1}).addTo(map);
        var line6 = L.polyline([marker6.getLatLng(), allPos[Math.floor(length*(7/8))]], {color:"black", weigth:1}).addTo(map);

        weatherLayerGroup = L.layerGroup([marker1, marker2, marker3, marker4, marker6 ]).addTo(map);
        weatherLayerGroupLines = L.layerGroup([line1, line2, line3, line4, line6]).addTo(map);
        isWeatherDisplayed = true;
        updatePositions();
    } else if (!isWeatherDisplayed){ //Display
        weatherLayerGroup.addTo(map);
        weatherLayerGroupLines.addTo(map);
        isWeatherDisplayed = true;
        document.getElementById("weatherLayer").classList.add('selectedLayer');
    } else { //Hide
        weatherLayerGroup.removeFrom(map);
        weatherLayerGroupLines.removeFrom(map);
        isWeatherDisplayed = false;
        document.getElementById("weatherLayer").classList.remove('selectedLayer');
    }

}

/**
 * Returns the updated position of the weather icon after zoom
 * @param {L.LatLng} pos 
 * @param {number} index 
 * @returns {L.LatLng} 
 */
function getWeatherPos(pos, index){
    var posXY = toPixels(pos);
    var length = allPos.length;
    var newPosXY;
    if (isVertical(toPixels(allPos[Math.floor(length*((index-1)/8))]), toPixels(allPos[Math.floor(length*(index/8))]))){
        newPosXY = L.point(posXY.x-60, posXY.y);
    } else {
        newPosXY = L.point(posXY.x, posXY.y+60);
    }
    var newPosLatLng =  map.containerPointToLatLng(newPosXY);
    // var line = L.polyline([pos, newPosLatLng], {color:"black", weigth:2});
    return newPosLatLng;
}

/**
 * Updates the position of the weather icons
 */
function updatePositions(){
    var layers = weatherLayerGroup.getLayers();
    var lines = weatherLayerGroupLines.getLayers();
    var prevPoint = toPixels(allPos[0]);
    for (var i = 0; i < layers.length; i++){
        var latLng = layers[i].getLatLng();
        var curLine = lines[i].getLatLngs();
        var closest;
        if (curLine[0] == latLng){
            closest = curLine[1];
        } else {
            closest = curLine[0];
        }
       
        var closestXY = toPixels(closest);
       
        var newXY;
        if (isVertical(prevPoint, closestXY)){
            newXY = L.point((closestXY.x-60), closestXY.y);
        } else {
            newXY = L.point(closestXY.x, (closestXY.y+60));
        }
        var newLatLng = map.containerPointToLatLng(newXY);
        layers[i].setLatLng(newLatLng);
        prevPoint = closestXY;
        lines[i].setLatLngs([newLatLng, closest]);
    }


}

/**
 * Toggle Restaurant Distribution gradient
 */
function toggleRestaurantDistribution(){
    var outlineHTML = document.getElementById("strokeRoute");
    if(isRestaurantDisplayed){
        outlineHTML.setAttribute("stroke", "blue");
        outlineHTML.setAttribute("stroke-opacity", "0.25");
        isRestaurantDisplayed = false;
        document.getElementById("restaurantLayer").classList.remove('selectedLayer');
    } else {
        outlineHTML.setAttribute("stroke", "url(#gradientRestaurant)");
        outlineHTML.setAttribute("stroke-opacity", "0.7");
        isRestaurantDisplayed = true;
        isFuelDisplayed = false;
        isElevationDisplayed = false;
        document.getElementById("restaurantLayer").classList.add('selectedLayer');
        document.getElementById("elevationLayer").classList.remove('selectedLayer');
        document.getElementById("gasstationLayer").classList.remove('selectedLayer');
        document.getElementById("supermarketLayer").classList.remove('selectedLayer');
    }
    // L.DomUtil.addClass(outlineHTML, "outlineRestaurant");
}

/**
 * Toggle Gas station Distribution gradient
 */
function toggleFuelDistribution(){
    var outlineHTML = document.getElementById("strokeRoute");
    if(isFuelDisplayed){
        outlineHTML.setAttribute("stroke", "blue");
        outlineHTML.setAttribute("stroke-opacity", "0.25");
        isFuelDisplayed = false;
        document.getElementById("gasstationLayer").classList.remove('selectedLayer');
    } else {
        outlineHTML.setAttribute("stroke", "url(#gradientFuel)");
        outlineHTML.setAttribute("stroke-opacity", "0.7");
        isFuelDisplayed = true;
        isRestaurantDisplayed = false;
        isElevationDisplayed = false;
        document.getElementById("gasstationLayer").classList.add('selectedLayer');
        document.getElementById("restaurantLayer").classList.remove('selectedLayer');
        document.getElementById("elevationLayer").classList.remove('selectedLayer');
        document.getElementById("supermarketLayer").classList.remove('selectedLayer');
    }
    // L.DomUtil.addClass(outlineHTML, "outlineRestaurant");
}

/**
 * Toggle Elevation gradient
 */
function toggleElevationDistribution(){
    console.log("elevation");
    var outlineHTML = document.getElementById("strokeRoute");
    if(isElevationDisplayed){
        outlineHTML.setAttribute("stroke", "blue");
        outlineHTML.setAttribute("stroke-opacity", "0.25");
        isElevationDisplayed = false;
        document.getElementById("elevationLayer").classList.remove('selectedLayer');
    } else {
        outlineHTML.setAttribute("stroke", "url(#gradientMarket)");
        outlineHTML.setAttribute("stroke-opacity", "0.7");
        isElevationDisplayed = true;
        isRestaurantDisplayed = false;
        isFuelDisplayed = false;
        document.getElementById("elevationLayer").classList.add('selectedLayer');
        document.getElementById("restaurantLayer").classList.remove('selectedLayer');
        document.getElementById("gasstationLayer").classList.remove('selectedLayer');
        document.getElementById("supermarketLayer").classList.remove('selectedLayer');
    }
}

/**
 * Toggle Supermarket gradient
 */
function toggleSupermarketDistribution(){
    console.log("elevation");
    var outlineHTML = document.getElementById("strokeRoute");
    if(isSupermarketDisplayed){
        outlineHTML.setAttribute("stroke", "blue");
        outlineHTML.setAttribute("stroke-opacity", "0.25");
        isSupermarketDisplayed = false;
        document.getElementById("supermarketLayer").classList.remove('selectedLayer');
    } else {
        outlineHTML.setAttribute("stroke", "url(#gradientElevation)");
        outlineHTML.setAttribute("stroke-opacity", "0.7");
        isSupermarketDisplayed = true;
        isRestaurantDisplayed = false;
        isFuelDisplayed = false;
        isElevationDisplayed = false;
        document.getElementById("supermarketLayer").classList.add('selectedLayer');
        document.getElementById("elevationLayer").classList.remove('selectedLayer');
        document.getElementById("restaurantLayer").classList.remove('selectedLayer');
        document.getElementById("gasstationLayer").classList.remove('selectedLayer');
    }
}

/********************************************************************************
 *                                   Brackets                                   *
 ********************************************************************************/

/**
 * Create the HTML Floating texts elements
 */
function createFloatingTexts(){
    let ETAFloatingText=document.createElement('div');
    ETAFloatingText.style.zIndex = 500;
    ETAFloatingText.style.visibility='hidden';

    ETAFloatingText.id="cursorText"; 

    document.body.appendChild(ETAFloatingText);

    let bracketOpenText=document.createElement('div');
    bracketOpenText.style.zIndex = 400;
    bracketOpenText.style.visibility='hidden';
    bracketOpenText.id="bracketText";
    document.body.appendChild(bracketOpenText);

    let bracketCloseText=document.createElement('div');
    bracketCloseText.style.zIndex = 400;
    bracketCloseText.style.visibility='hidden';
    bracketCloseText.id="bracketCloseText";
    document.body.appendChild(bracketCloseText);

    let circleMarkerText=document.createElement('div');
    circleMarkerText.style.zIndex = 400;
    circleMarkerText.style.visibility='hidden';
    circleMarkerText.id="circleText";
    document.body.appendChild(circleMarkerText);
}

/**
 * Updates text from drag on itinerary
 * @param {L.LatLng} latlng 
 * @param {L.Point} point 
 */
function distancePixelPoints(latlng, point){
    
    let ETAFloatingText = document.getElementById("cursorText");
    if (state == "itinerary"){
    // map.removeLayer(routing_line);
    var distFromLine = getDistanceInCM(latlng, point, allPos);
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
        ETAFloatingText.innerHTML=inHours(percent*time/100);
    }
    
    } else
    
    {
        ETAFloatingText.style.visibility='hidden';
    }

}

/**
 * Hides the floating texts
 */
function hideFloatingTexts(){
    let bracketOpenText = document.getElementById("bracketText");
    let bracketCloseText = document.getElementById("bracketCloseText");
    let circleMarkerText = document.getElementById("circleText");

    bracketOpenText.style.visibility = 'hidden';
    bracketCloseText.style.visibility = 'hidden';
    circleMarkerText.style.visibility = 'hidden';

}

/**
 * Shows the floating texts
 */
function showFloatingTexts(){
    let bracketOpenText = document.getElementById("bracketText");
    let bracketCloseText = document.getElementById("bracketCloseText");
    let circleMarkerText = document.getElementById("circleText");

    bracketOpenText.style.visibility = 'visible';
    bracketCloseText.style.visibility = 'visible';
    circleMarkerText.style.visibility = 'visible';
}

/**
 * Updates the ETA floating text position
 * @param {PointerEvent} e 
 */
function moveCursor(e){
    let ETAFloatingText = document.getElementById("cursorText");
    if (ETAFloatingText != null){
        let ETAFloatingTextSize=[ETAFloatingText.offsetWidth,ETAFloatingText.offsetHeight];
        let left = e.clientX-ETAFloatingTextSize[0]-20;
        if (left < 5){
            left = e.clientX + 20;
        }
        ETAFloatingText.style.left=left+'px';
        ETAFloatingText.style.top=e.clientY-ETAFloatingTextSize[1]-50+'px'; 
    }   
}

/**
 * Draws/updates the selected part of the route
 * @param {L.LatLng} latlngAbove 
 * @param {L.LatLng} latlngBelow 
 */
function lineBracketsHighlight(latlngAbove, latlngBelow){
    var closestAbove = L.GeometryUtil.closest(map, allPos, latlngAbove);
    isPointOnLine(closestAbove, allPos, 0.5);
    var pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    var closestBelow = L.GeometryUtil.closest(map, allPos, latlngBelow);
    isPointOnLine(closestBelow, allPos, 0.5);
    
    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    if (polylineBracket != null){
        map.removeLayer(polylineBracket);
    }
    
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 48, opacity: 0.5, lineCap: 'butt'}).addTo(map);

    // console.log(isVertical(toPixels(markerBracketOpen.getLatLng()), toPixels(markerBracketClose.getLatLng())));

    circleZoneOfInterest.bringToFront()
}

/**
 * Spawns the range markers
 * @param {PointerEvent} event 
 */
function createBrackets(event){
    //greys out rest
    //make bracket appear
    let closest = L.GeometryUtil.closest(map, allPos, event); //get the closest point on the line
    isPointOnLine(closest, allPos, 5); // add all the points up to this point
    
    if (markerBracketClose != null && markerBracketOpen != null){
        map.removeLayer(markerBracketClose);
        map.removeLayer(markerBracketOpen);
        map.removeLayer(polylineBracket);
    }

    points.push(closest); //add this point
    let dist = 0;
    for (let i = 0; i < points.length - 1; i++){ //calculate the distance from the start to this point
        dist += points[i].distanceTo(points[i+1]);
    }
    let percent = dist*100/distance; //get it in %
    let timeDiffInPercent = defaultBracketRange*100/time; //get the time diff between the brackets in % 
    let percentAbove = percent - timeDiffInPercent; 
    let distAbove = (percentAbove*distance)/100;
    let percentBelow = percent + timeDiffInPercent;
    let distBelow = (percentBelow*distance)/100;
    
    //Create Marker Open
    console.log(itineraryJSON);
    console.log(distAbove/1000);
    let pointAbove = turf.along(itineraryJSON, distAbove/1000).geometry.coordinates;
    let latlngAbove =  L.latLng(pointAbove[1], pointAbove[0]);
    markerBracketOpen = L.marker(latlngAbove, {icon: bracket, rotationOrigin: 'center center'}).addTo(map);
    markerBracketOpen.dragging.enable();

  
    //Create Marker Close
    let pointBelow = turf.along(itineraryJSON, distBelow/1000).geometry.coordinates;
    let latlngBelow =  L.latLng(pointBelow[1], pointBelow[0]);
    markerBracketClose = L.marker(latlngBelow, {icon: bracket, rotationOrigin: 'center center'}).addTo(map);
    markerBracketClose.dragging.enable();

    //Marker interactions
    markerBracketClose
                .on("dragend", function(e){
                    if (state == "pointPlaced" || state == "closeMove"){
                        updateBracketCloseText();
                        updateMarkersRotation(markerBracketClose, false);
                    }
                })
                .on("dragstart", function(e){
                    if (state == "pointPlaced" || state == "closeMove"){
                        previousClosePos = markerBracketClose.getLatLng();
                        state = "closeMove";
                        
                        isMovingBrackets = true;
                    }
                })
                .on("drag", function(e){
                    console.log(state);
                    if (state == "pointPlaced" || state == "closeMove"){
                        isMovingBrackets = true;
                        
                        if(circleZoneOfInterest.getLatLng().distanceTo(markerBracketClose.getLatLng()) < 50000){
                            markerBracketClose.setLatLng( L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng()));
                            lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
                            let bracketCloseText = document.getElementById("bracketCloseText");
                            updatePosTexts(bracketCloseText, markerBracketClose, isVertical(toPixels(markerBracketClose.getLatLng()), toPixels(circleZoneOfInterest.getLatLng())));
                            updateBracketCloseText();
                            // updateMarkersRotation(markerBracketClose, false);
                        
                        }  else {
                            markerBracketClose.dragging.disable();
                        }
                    }

                    
                })

    
    markerBracketOpen
                .on("dragend", function(e){
                    if (state == "pointPlaced" || state == "openMove"){
                        updateBracketOpenText();
                        updateMarkersRotation(markerBracketOpen, true);
                    }
                })
                .on("dragstart", function(e){
                    if (state == "pointPlaced" || state == "openMove"){
                        previousOpenPos = markerBracketOpen.getLatLng();
                        state = "openMove";
                    
                        console.log("drag open");
                        isMovingBrackets = true;
                    }
                })
                .on("drag", function(e){
                    if (state == "pointPlaced" || state == "openMove"){
                        isMovingBrackets = true;
                        
                        if(circleZoneOfInterest.getLatLng().distanceTo(markerBracketOpen.getLatLng()) < 50000){
                            markerBracketOpen.setLatLng(L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng()));
                            lineBracketsHighlight(markerBracketOpen.getLatLng(),  markerBracketClose.getLatLng());
                            let bracketOpenText = document.getElementById("bracketText");
                            updatePosTexts(bracketOpenText, markerBracketOpen, isVertical(toPixels(markerBracketOpen.getLatLng()), toPixels(circleZoneOfInterest.getLatLng())));
                            updateBracketOpenText();
                            var latLngs = polylineBracket.getLatLngs();
                            // updateMarkersRotation(markerBracketOpen, true);
                        } else {
                            markerBracketOpen.dragging.disable();
                        }
                        
                    }
                   
                })

    
    //Set floating texts
    let bracketOpenText = document.getElementById("bracketText");
    updateBracketOpenText();

    let bracketCloseText = document.getElementById("bracketCloseText");
    updateBracketCloseText();

    let circleMarkerText = document.getElementById("circleText");
    circleMarkerText.innerHTML=(dist/1000).toFixed(0) + "km";

    showFloatingTexts()

    //Set floating texts positions
    updateMarkerTextPos();

    //Draw the highlight line
    lineBracketsHighlight(latlngAbove, latlngBelow);

    //Rotation
    // let circlePos = circleZoneOfInterest.getLatLng();
    // previousOpenPos = circlePos;
    // previousClosePos = circlePos;

    // updateMarkersRotation(markerBracketOpen, true);
    // updateMarkersRotation(markerBracketClose, false);
}

/**
 * Updates the range markers' texts positions
 * @param {HTMLElement} text 
 * @param {*} element 
 * @param {boolean} isVert 
 */
function updatePosTexts(text, element, isVert){

    if (element != null){
        if (isVert){
            var left = toPixels(element.getLatLng()).x+60;
            var top = toPixels(element.getLatLng()).y-5;
            var textSize=[text.offsetWidth,text.offsetHeight];
            if (left + textSize[0] > width){
                left = left - 160;
            }
            text.style.left=left+'px';
            text.style.top=top+'px';
            
        } else{
            var left = toPixels(element.getLatLng()).x-10;
            var top = toPixels(element.getLatLng()).y+50;
            var textSize=[text.offsetWidth,text.offsetHeight];
            if (top + textSize[1] > height){
                top = top - 100;
            }
            text.style.left=left+'px';
            text.style.top=top+'px';
            
        }
        if (left + textSize[0] > width || top + textSize[1] > height || top < 5 || left < 5){
            text.style.visibility = "hidden"; 
        } else if (state != "itinerary"){
            text.style.visibility = "visible"; 
        }
        
    }


}

/**
 * Update text from the close range marker
 */
function updateBracketCloseText(){
    let fix = 0;
    if (transportationMode == "foot"){fix = 1;}
    var closestAbove = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
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
    let bracketCloseText = document.getElementById("bracketCloseText");
    bracketCloseText.innerHTML="+ " + (distCircleBracket/1000).toFixed(fix) +" km";
}

/**
 * Update text from the open range marker
 */
function updateBracketOpenText(){
    let fix = 0;
    if (transportationMode == "foot"){fix = 1;}
    var closestAbove = L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng());
    isPointOnLine(closestAbove, allPos, 0.5);
    var pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    var closestBelow = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
    isPointOnLine(closestBelow, allPos, 0.5);
    
    var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    var distCircleBracket = 0;
    for (var i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
        distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
    }
    // console.log(" real dist: "+ Math.round(distCircleBracket/1000));
    // console.log(" leaflet dist: " +  Math.round(closestAbove.distanceTo(closestBelow)/1000));
    let bracketOpenText = document.getElementById("bracketText");
    bracketOpenText.innerHTML="- " + (distCircleBracket/1000).toFixed(fix) +" km";
}

/**
 * Handles the moving of the markers when dragging the middle marker
 * @param {L.LatLng} latlng 
 */
function moveMarkers(latlng){
    console.log("movemarkers");
    console.log(state);
    if( clickOnCircle && (state == "circleMove" || state == "pointPlaced")){
        // console.log("dist before open: " + markerBracketOpen.getLatLng().distanceTo(circleZoneOfInterest.getLatLng()) + ", close : " + + markerBracketClose.getLatLng().distanceTo(circleZoneOfInterest.getLatLng()));
        
        let prevCirclePose = circleZoneOfInterest.getLatLng(); //store the previous circle pos

        //Set the middle range marker position
        let closest = L.GeometryUtil.closest(map, allPos, latlng);
        circleZoneOfInterest.setLatLng(closest);

        let diff = prevCirclePose.distanceTo(closest); //Distance between previous circle pos and new circle pos

        let distPrev = prevCirclePose.distanceTo(allPos[0]); //Distance from prev pos to first point
        let distAct = closest.distanceTo(allPos[0]); //Distance fromm new pos to first pos
    
        //Get the sign of the difference (if we're moving closer to the start -> minus; else -> plus)
        let diffSign;

        var distCircleBracket = 0;

        if (distPrev < distAct){ //Marker moved away from start
            diffSign = diff;

            var closestAbove = L.GeometryUtil.closest(map, allPos, prevCirclePose);
            isPointOnLine(closestAbove, allPos, 0.5);
            var pointsAbove = new Array();
            points.forEach(element => {pointsAbove.push(element)});

            var closestBelow = closest;
            isPointOnLine(closestBelow, allPos, 0.5);

            var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
            for (var i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
                distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
            }
        } else {
            diffSign = -diff;

            var closestAbove = closest;
            isPointOnLine(closestAbove, allPos, 0.5);
            var pointsAbove = new Array();
            points.forEach(element => {pointsAbove.push(element)});

            var closestBelow = L.GeometryUtil.closest(map, allPos, prevCirclePose);
            isPointOnLine(closestBelow, allPos, 0.5);

            var pointsToKeep = points.filter(n => !pointsAbove.includes(n));
            for (var i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
                distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
            }

            distCircleBracket = -distCircleBracket;
        }

        //Set the open bracket position
        var openClosestAbove = L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng());
        isPointOnLine(openClosestAbove, allPos, 0.5);
        var openPointsAbove = new Array();
        points.forEach(element => {openPointsAbove.push(element)});
        
        var openDistCircleBracket = 0;
        for (var i = 0; i < openPointsAbove.length - 1; i++){ //calculate the distance from the start to this point
            openDistCircleBracket += openPointsAbove[i].distanceTo(openPointsAbove[i+1]);
        }
        console.log("dist bracket : " + Math.round(openDistCircleBracket/1000));
        openDistCircleBracket += distCircleBracket;
        var pointAbove = turf.along(itineraryJSON, openDistCircleBracket/1000).geometry.coordinates;
        var latlngAbove =  L.latLng(pointAbove[1], pointAbove[0]);
        markerBracketOpen.setLatLng(latlngAbove);
        console.log("LatLng above : " + latlngAbove);

        //Set the close bracket position
        var closeClosestAbove = L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng());
        isPointOnLine(closeClosestAbove, allPos, 0.5);
        var closePointsAbove = new Array();
        points.forEach(element => {closePointsAbove.push(element)});
        var closeDistCircleBracket = 0;
        for (var i = 0; i < closePointsAbove.length - 1; i++){ //calculate the distance from the start to this point
            closeDistCircleBracket += closePointsAbove[i].distanceTo(closePointsAbove[i+1]);
        }
        closeDistCircleBracket += distCircleBracket;
        var pointBelow = turf.along(itineraryJSON, closeDistCircleBracket/1000).geometry.coordinates;
        var latlngBelow = L.latLng(pointBelow[1], pointBelow[0]);
        markerBracketClose.setLatLng(latlngBelow);
        

        
        //Update line highlight and texts and texts positions
        lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
        updateMarkerTextPos();
        updateBracketCloseText();
        updateBracketOpenText();
        
        isPointOnLine(closest, allPos, 5);
        points.push(closest);
        var dist = 0;
        for (var i = 0; i < points.length - 1; i++){
            dist += points[i].distanceTo(points[i+1]);
        }
        let circleMarkerText = document.getElementById("circleText");
        circleMarkerText.innerHTML=(dist/1000).toFixed(0) +"km";
        // state = "circleMove";
        // console.log("stateChanged");
    } 
}

/**
 * Update the range markers positions
 */
function updateMarkerTextPos(){
    if (markerBracketClose != null){
        let bracketOpenText = document.getElementById("bracketText");
        let bracketCloseText = document.getElementById("bracketCloseText");
        let circleMarkerText = document.getElementById("circleText");

        updatePosTexts(bracketCloseText, markerBracketClose, isVertical(toPixels(markerBracketClose.getLatLng()), toPixels(circleZoneOfInterest.getLatLng())));
        updatePosTexts(bracketOpenText, markerBracketOpen, isVertical(toPixels(markerBracketOpen.getLatLng()), toPixels(circleZoneOfInterest.getLatLng())));
        updatePosTexts(circleMarkerText, circleZoneOfInterest, isVertical(toPixels(circleZoneOfInterest.getLatLng()), toPixels(markerBracketOpen.getLatLng())));
    }
}

/********************************************************************************
 *                              Brackets Rotations                              *
 ********************************************************************************/

/**
 * Updates the rotation of the marker so it is perpendicular to the itinerary
 * @param {L.Marker} marker 
 * @param {boolean} isOpen 
 */
function updateMarkersRotation(marker, isOpen){
    var dist = getDistMarkers(marker.getLatLng(), isOpen);
    if (dist > 0.3 || previousClosePos == circleZoneOfInterest.getLatLng() || previousOpenPos == circleZoneOfInterest.getLatLng()){   
        var vect;
        if (isOpen){
            vect = normalVector(toPixels(marker.getLatLng()), toPixels(previousOpenPos));
        } else {
            vect = normalVector(toPixels(previousClosePos), toPixels(marker.getLatLng()));
        }
        var angle = getAngle(vect);
        // console.log(angle);
        marker.setRotationAngle(angle);
        if (isOpen){
            previousOpenPos = marker.getLatLng();
        } else {
            previousClosePos = marker.getLatLng();
        }
    } 
}

/**
 * Get the distance between the marker and its previous position
 * @param {L.LatLng} pos 
 * @param {true} isOpen 
 * @returns {number}
 */
function getDistMarkers(pos, isOpen){
    var posPixel = toPixels(pos);
    var lastPixels;
    if (isOpen){
        lastPixels = toPixels(previousOpenPos); 
    } else {
        lastPixels = toPixels(previousClosePos); 
    }
    return ((posPixel.distanceTo(lastPixels)*2.54/(ppi/window.devicePixelRatio))); 
}

/**
 * Returns the angle in degrees
 * @param {number} radians 
 * @returns {number}
 */
function radToDeg(radians){
  return radians * (180/Math.PI);
}

/**
 * Returns the angle in radians
 * @param {number} degrees 
 * @returns {number}
 */
function degToRad(degrees)
{
  // Store the value of pi.
  var pi = Math.PI;
  // Multiply radians by 180 divided by pi to convert to degrees.
  return degrees * (pi/180);
}

/**
 * Returns the ange by which to rotate a marker
 * @param {number} coeff 
 * @returns {number}
 */
function getAngle(coeff){
    var norm = Math.sqrt(coeff[0]*coeff[0] + coeff[1]*coeff[1]);
    var dot = coeff[0]/norm;
    var angle = Math.acos(dot);
    // console.log(angle);
    return 360-radToDeg(angle);
}

/**
 * Returns the normal vector of the line formed by pointA and pointB
 * @param {L.Point} pointA 
 * @param {L.Point} pointB 
 * @returns {L.Point[]}
 */
function normalVector(pointA, pointB){
    // console.log(pointA);
    // console.log(pointB);
    var coeffDirecteur =  (pointB.y-pointA.y)/(pointB.x-pointA.x);
    return [coeffDirecteur, -1];
}

/********************************************************************************
 *                                  Utilities                                   *
 ********************************************************************************/
/**
 * 
 * @param {L.Point[]} line Array in Point(x,y) 
 * @returns {L.LatLng[]} Array in LatLng(lat,lng)
 */
function pointToLatLng(line){
    var res = [];
    line.forEach(element => {
        res.push(map.containerPointToLatLng(element));
    })
    return res;
}

/**
 * 
 * @param {L.LatLng[]} line Array in LatLng(lat,lng)
 * @returns {L.Point[]} Array in Point(x,y)
 */
function latLngToPoint(line){
    var res = [];
    line.forEach(element => {
        res.push(toPixels(element));
    })
    return res;
}

/**
 * 
 * @param {L.LatLng} latlng LatLng(lat,lng)
 * @returns {L.Point} Point(x,y)
 */
function toPixels(latlng){
    return map.latLngToContainerPoint(latlng);
}

/**
 * Toggles visibility of an HTML element from visible to collapse
 * @param {HTMLElement} element 
 */
function visibilityToggle(element){
    if (element.style.visibility == "visible"){
        element.style.visibility = "collapse";
    } else {
        element.style.visibility = "visible";
    }
}

/**
 * 
 * @param {Point} pointA Point(x,y)
 * @param {Point} pointB Point(x,y)
 * @returns if the segment from pointA to pointB is vertical or not
 */
function isVertical(pointA, pointB){
    if ((pointB.y - pointA.y) == 0){
        // L.polyline([map.containerPointToLatLng(pointA), map.containerPointToLatLng(pointB)], {color:'green', weight:3}).addTo(map);
        return false;
    } else if (pointB.x - pointA.x == 0){
        // L.polyline([map.containerPointToLatLng(pointA), map.containerPointToLatLng(pointB)], {color:'red', weight:3}).addTo(map);    
        return true;
    } else {
        var coeff = Math.abs((pointB.y - pointA.y)/(pointB.x - pointA.x));
        // console.log(coeff);
        // if (coeff > 0.3){
        //     L.polyline([map.containerPointToLatLng(pointA), map.containerPointToLatLng(pointB)], {color:'red', weight:3}).addTo(map);
        // } else {
        //     L.polyline([map.containerPointToLatLng(pointA), map.containerPointToLatLng(pointB)], {color:'green', weight:3}).addTo(map);
        // }
        return coeff > 0.3;
    }
}

/**
 * Coords in LatLng to JSTS
 * @param {LatLng[]} coords Array in LatLng(lat,lng)
 * @returns {JSTSCoords[]} Array in JSTS Coord(lat,lng)
 */
function latLngToJSTS(coords){
    var coordsJSTS = [];
    for(var i = 0; i < coords.length; i++){
        coordsJSTS.push(new jsts.geom.Coordinate(coords[i].lat, coords[i].lng));
    }
    return coordsJSTS;
}

/**
 * Coords in JSTS to LatLng
 * @param {JSTSCoords[]} coords Array in JSTS Coord(lat,lng)
 * @returns {LatLng[]} Array in LatLng(lat,lng)
 */
function JSTStoLatLng(coords){
    var coordsLatLng = [];
    for(var i = 0; i < coords.length; i++){
        coordsLatLng.push(L.latLng(coords[i].x, coords[i].y));
    }
    return coordsLatLng;

}

/**
 * Returns the distance between a point and the itinerary in cm
 * @param {L.LatLng} latlng 
 * @param {L.Point} point 
 * @param {L.LatLng[]} route 
 * @returns 
 */
function getDistanceInCM(latlng, point, route){
    var closest = L.GeometryUtil.closest(map, route, latlng);
    var closestPixel = toPixels(closest);
    return ((point.distanceTo(closestPixel)*2.54/(ppi/window.devicePixelRatio))); //269 = ppi from phone
}

/**
 *Alerts the screen resolution of the device 
 */
function getResolution() {
    alert("Your screen resolution is: " + (screen.width* window.devicePixelRatio) + "x" + (screen.height* window.devicePixelRatio));
}

/**
 * Check if a point is on a route and stores all the points between the start of the route and the point
 * @param {L.LatLng} point 
 * @param {L.LatLng[]} path 
 * @param {number} accuracy 
 * @returns 
 */ 
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

/**
 * Returns a string "x min"
 * @param {number} time 
 * @returns {string}
 */
function toMinutes(time){
    var mins = Math.floor(time/60);
    var rest = (time - (60*mins)).toFixed(0);
    return (mins + " min " /*+ rest + " sec"*/);
}

/**
 * Returns a string "x hour y min"
 * @param {number} time 
 * @returns {string}
 */
function toHour(time){
    var mins = Math.floor(time/60);
    var hours = Math.floor(mins/60);
    var rest = (mins - (60*hours)).toFixed(0);
    return (hours + " h " + rest + " min");;
}

/**
 * Returns a string "x hour y min" but for the time diff
 * @param {number} time 
 * @returns {s}
 */ 
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

/**
 * Creates a button with the specified label in the specified container
 * @param {string} label 
 * @param {HTMLElement} container 
 * @returns 
 */
function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

/********************************************************************************
 *                                Event Handlers                                *
 ********************************************************************************/


map.on("zoomanim", function(e){
    if(markerBracketClose != null){
        let bracketOpenText = document.getElementById("bracketText");
        bracketOpenText.style.left=toPixels(markerBracketOpen.getLatLng()).x+20+'px';
        bracketOpenText.style.top=toPixels(markerBracketOpen.getLatLng()).y-50+'px';
        // bracketOpenText.innerHTML="distance "+isMovingBrackets;
        let bracketCloseText = document.getElementById("bracketCloseText");
        bracketCloseText.style.left=toPixels(markerBracketClose.getLatLng()).x+20+'px';
        bracketCloseText.style.top=toPixels(markerBracketClose.getLatLng()).y-50+'px';
        // bracketCloseText.innerHTML="distance "+isMovingBrackets;
        let circleMarkerText = document.getElementById("circleText");

        circleMarkerText.style.left=toPixels(circleZoneOfInterest.getLatLng()).x+20+'px';
        circleMarkerText.style.top=toPixels(circleZoneOfInterest.getLatLng()).y-50+'px';
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
        zoomMult = 1280000/(Math.pow(2,zoom));
        circleZoneOfInterest.setRadius(zoomMult);
        // console.log("zoom level: " + zoom + ", circle radius: " + circleZoneOfInterest.getRadius());

    }
})

onpointerdown = (event) => {
    startTime = Date.now();
    isPointerDown = true;
    prevZoom = map.getZoom();
    if (state == "menu" || state == "slider"){
        markerBracketClose.dragging.disable();
        markerBracketOpen.dragging.disable();
    }
    if (circleZoneOfInterest != null && event.target == circleZoneOfInterest._path || event.target == outlinePathHTML || event.target == stroke._path || event.target == itinerary._path){
        map.dragging.disable();
    }

};

onpointermove = (event) => {
    const millis = Date.now() - startTime;
    if ((millis / 1000) > 0.2){
        if(isPointerDown){ //Only for computers
            updateMarkerTextPos();
            isMovingMap = true;
            var point = L.point(event.clientX, event.clientY); //point in pixel
            var latlng = map.containerPointToLatLng(point); //point in latlng
            distancePixelPoints(latlng, point);
            if (state == "pointPlaced" || state == "circleMove"){
                // if(latlng.distanceTo(circleZoneOfInterest.getLatLng()) < circleZoneOfInterest.getRadius()){
                if(clickOnCircle){
                    isMovingMarker = true;
                    state = "circleMove";
                }
                moveMarkers(latlng); //move the threemarkers together
            }
        } 
    }
    moveCursor(event); //text follow mouse
        
    if (isMenuOn){
        var menuDiv = document.getElementById("menu");
        var circlePos = toPixels(circleZoneOfInterest.getLatLng());
        var top = circlePos.y - 70;
        // console.log()
        if (top < 5){
            top = circlePos.y + 50;
        }
        menuDiv.style.left=circlePos.x - 50 + 'px';
        menuDiv.style.top=top +  'px';

        var sliderDiv = document.getElementById("slider");
        // // sliderDiv.style.visibility = "visible";
        // // var circlePos = toPixels(circleMarker.getLatLng());
        var topSlider = circlePos.y - 150;
        if (topSlider < 5){
            topSlider+=200;
        }
        sliderDiv.style.left=circlePos.x - 65 + 'px';
        sliderDiv.style.top=topSlider +  'px';
    }
};

onpointerup = (event) => {
    console.log(state);
    // console.log(event.target);
    // Get the pointer coords
    let ETAFloatingText = document.getElementById("cursorText");
    ETAFloatingText.style.visibility='hidden';
    var point = L.point(event.clientX, event.clientY);
    var latlng = map.containerPointToLatLng(point);
    console.log("!clickMenu: " + !clickOnMenu + ", !movemap: " + !isMovingMap);
    if (state == "menu" && !clickOnMenu && !isMovingMap && (prevZoom == map.getZoom())){
        var menuDiv = document.getElementById("menu");
        menuDiv.style.visibility = "hidden";
        state = "pointPlaced";
        markerBracketClose.dragging.enable();
        markerBracketOpen.dragging.enable();
        clickOnMenu = false;
    } else if (state == "slider" && !clickOnSlider && !isMovingMap  && (prevZoom == map.getZoom())){
        var sliderDiv = document.getElementById("slider");
        sliderDiv.style.visibility = "hidden";
        state = "pointPlaced";
        markerBracketClose.dragging.enable();
        markerBracketOpen.dragging.enable();
        clickOnSlider = false;
    } else if (state == "pointPlaced"){
        pointPlacedToItinerary(latlng, point);
    } else if(state == "itinerary"){
        console.log(latlng);
        itineraryToPointPlaced(latlng,point);
    } 
    if (state != "itinerary"){
        updateMarkerTextPos();
    }
    if(state == "circleMove" || state == "openMove" || state == "closeMove"){
        if (state == "openMove"){
            markerBracketOpen.setLatLng(polylineBracket.getLatLngs()[0]);
        } else if (state == "closeMove"){
            let polyLatLngs = polylineBracket.getLatLngs();
            markerBracketClose.setLatLng(polyLatLngs[polyLatLngs.length-1]);
        }
        state = prevState;
        

    }
    isPointerDown = false;
    isMovingMarker = false;
    isMovingBrackets = false;
    isMovingMap = false;
    clickOnCircle = false;
    clickOnLayer = false;
    map.dragging.enable();
    
    
    var zoom = map.getZoom();
    // console.log("   zoom level   " + zoom);
    if (zoom > 14){
        itinerary.setStyle({weight : 8*(zoom-13)}); //keep the itinerary always bigger than road 
    } else {
        itinerary.setStyle({weight : 8});
    }
    if (circleZoneOfInterest != null){
        var zoomMult = Math.floor(2200000/(Math.pow(2,zoom)));
        circleZoneOfInterest.setRadius(zoomMult);

    }
    if(isWeatherDisplayed){
        updatePositions();
    }
    if (isMenuOn){
        var menuDiv = document.getElementById("menu");
        var circlePos = toPixels(circleZoneOfInterest.getLatLng());
        var top = circlePos.y - 70;
        // console.log()
        if (top < 5){
            top = circlePos.y + 50;
        }
        menuDiv.style.left=circlePos.x - 50 + 'px';
        menuDiv.style.top=top +  'px';
    }

    if(markerBracketClose != null && markerBracketOpen != null){
        if (map.hasLayer(markerBracketClose)){
            markerBracketOpen.dragging.enable();
            markerBracketClose.dragging.enable();            
        }
    }
    // stroke.bringToFront();
    // outline.bringToFront();
    // itinerary.bringToFront();
    // document.getElementsByTagName('body')[0].focus();
    
}


