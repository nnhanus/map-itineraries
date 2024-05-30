
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

const ppi = 410;
//Oppo A9: 269; Samsung Note 10: 401 ou 410

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

var infoRouteTop = 605;
const defaultRouteTop = 605;

var defaultBracketRange = 1200;
var transportationMode = "car"; //"car" or "foot"


const startCar = L.latLng(48.711967757928974, 2.166628674285006);
const endCar = L.latLng(47.20617749880269, -1.564392769503869);
// const endCar = L.latLng(48.69519492350087, 2.1760177471346864);
const coordsCar = [startCar, endCar];
// const coordsCar = [L.latLng(48.711967757928974, 2.166628674285006), L.latLng(48.69519492350087, 2.1760177471346864)];
const addressCar = ["Digiteo Moulon Batiment 660, 660 Av. des Sciences Bâtiment, 91190, 91190 Gif-sur-Yvette", "Les Machines de l'Île, Parc des Chantiers, Bd Léon Bureau, 44200 Nantes"];
const startFoot = L.latLng(43.59210153989353, 1.4447266282743285);
const endFoot = L.latLng(43.60560890094277, 1.4458011280603213);
const coordsFoot = [startFoot, endFoot];
const addressFoot = ["Palais de Justice, 31400 Toulouse", "Happywool.com, 31000 Toulouse"];
const gradientPalette = ["#04055E", "#00029C", "#0000FF", "#4849EE", "#7173FF", "#C9C9E4", "#E6E6FD"]; //Darkest to Lightest

var routingWaypoints = [startCar, endCar];
var routingAddresses = ["Digiteo Moulon Batiment 660, 660 Av. des Sciences Bâtiment, 91190, 91190 Gif-sur-Yvette", "Les Machines de l'Île, Parc des Chantiers, Bd Léon Bureau, 44200 Nantes"];
var routingMarkers = [];

const APIKey = '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f';

var openCircleDist = 0;
var closeCircleDist = 0;
var previousCirclePosition;

var tempMarkerOpen;
var tempMarkerClose;
let needRedraw = false;

var interval = false;
var intervalID;

var isFloatingTextKM = true;
var areBracketsOn = false;

/********************************************************************************
 *                                   Controls                                   *
 ********************************************************************************/

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
            let menu = document.getElementById("hiddenLayers");
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
            // console.log(transportationMode);
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
        input.setAttribute("src", "icons/routing.svg");
        input.setAttribute("width", "22");
        input.setAttribute("height", "22");
        container.append(input);

        
        container.onpointerup = function(e){
            toggleRouteInfoVisibility();
        }
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

L.Control.Redraw = L.Control.extend({
    options:{
        position: 'topleft'
    },
    onAdd: function(map) {
        var container = document.getElementById("redraw");
        container.onclick = function(e){
            // if (interval){
            //     clearInterval(intervalID);
            //     document.getElementById("redrawButton").classList.remove('selectedLayer');
            // } else {
            //     document.getElementById("redrawButton").classList.add('selectedLayer');
            //     intervalID = setInterval(function() {
            //         console.log("interval");
                    forceRedraw();
                // }, 2000);
            // }
            // interval = !interval;
            
        }
        return container;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.redraw = function(opts){
    return new L.Control.Redraw(opts);
}
/********************************************************************************
 *                                   Routing                                    *
 ********************************************************************************/

let routing = L.control.routing({}).addTo(map);

/**
 * Sends the routing request to OSR
 */
function ORSRouting(){
    // orService = new Openrouteservice.Directions({api_key : APIKey});
    let request = new XMLHttpRequest();

    let link = "https://api.openrouteservice.org/v2/directions/";
    // let link = "https://mapitin.lisn.upsaclay.fr:8890/ors/v2/directions/";
    // https://mapitin.lisn.upsaclay.fr:8890/ors/v2 
    if (transportationMode == "car"){
        link += "driving-car";
    } else {
        link += "foot-hiking";
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
            // console.log(L.Polyline.fromEncoded(route.geometry));
            routingToPolyline(route);
        }
    };

    const body = routingWaypointsToQueryString(routingWaypoints);
    console.log(body);

    request.send(body);
}

/**
 * Sets the points of the itinerary from the query results
 * @param {JSON} routeJSON 
 */
function routingToPolyline(routeJSON){
    console.log("routing");
    
    time = routeJSON.summary.duration;
    distance = routeJSON.summary.distance;
    
    let closeButton = document.getElementById("closeDiv");
    closeButton.onpointerup = function(e){
        let container = document.getElementById("routingControl");
        container.style.visibility = "hidden";
    }

    let line = L.Polyline.fromEncoded(routeJSON.geometry);
    allPos = line.getLatLngs();

    weatherLayerGroup = null;
    weatherLayerGroupLines = null;
    
    // getResolution();
    reroute();
    map.fitBounds(stroke.getBounds());
    
    // console.log("ele: " + isElevationDisplayed + ", fuel: " +  isFuelDisplayed + ", resto: " + isRestaurantDisplayed);
    console.log("routesfound; dist = " + distance + " m; time = " + toMinutes(time));

}

/**
 * Handles drawing the itinerary from allPos
 */
function reroute(){
    console.log("reroute");
    var firstTime = true;
    if (itinerary != null){ //In case of re-route, make sure to delete evrything before adding new route
        map.removeLayer(itinerary);
        map.removeLayer(outline);
        map.removeLayer(stroke);
        firstTime = false;
        routingMarkers.forEach( (element) => {
            map.removeLayer(element);
        })
    }

    stroke = L.polyline(allPos, {color: 'blue', weight: 53,className: "outline willnotrender"}).addTo(map); // Draw the interaction zone
    let strokeHTML = stroke._path;

    outline = L.polyline(allPos, {color: 'blue', weight: 48, opacity: 0.25,className: "route willnotrender"}).addTo(map); // Draw the interaction zone
    outlinePathHTML = outline._path;
    outlinePathHTML.id = "strokeRoute";
    outlinePathHTML.setAttribute("class", "willnotrender");

    itinerary = L.polyline(allPos, {color: 'blue', weight: 8, className: "itinerary"}).addTo(map); //Draw a new polyline with the points
    itineraryJSON =  itinerary.toGeoJSON(); //convert the itinerary to JSON for distance purposes

   

    if (!firstTime){
        //Make sure the range markers are on the new itinerary
        if (circleZoneOfInterest != null){

        
            var newLatLng = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
            circleZoneOfInterest.setLatLng(newLatLng);
            circleZoneOfInterest.bringToFront()

            if (areBracketsOn){
                var newLLClose = L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng());
                markerBracketClose.setLatLng(newLLClose);

                var newLLOpen = L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng());
                markerBracketOpen.setLatLng(newLLOpen);
            
            }
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

        L.control.layers({}).addTo(map); //Add the layers menu to the map
        L.control.mode({}).addTo(map); //Switch between foot and car
        L.control.redraw({}).addTo(map);

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
    // stroke.bringToFront();
    // outline.bringToFront();
    // itinerary.bringToFront();

    routingWaypoints.forEach((element) => routingMarkers.push(L.marker(element).addTo(map)));

    let infoRoute = document.getElementById("routeInfo");
    if (transportationMode == "car"){
        infoRoute.innerHTML = (distance/1000).toFixed(0) + " km, " + toHour(time);
    } else {
        infoRoute.innerHTML = (distance/1000).toFixed(0) + " km, " + toMinutes(time);
    }
    const container = document.getElementById("geocoders");
    let children = container.children;
    // console.log("children length: " + children.length);

    while(children.length < routingAddresses.length){
        let geocoder = document.createElement("input");
        geocoder.setAttribute("class", "geocoder");
        container.append(geocoder);
        children = container.children;
        infoRouteTop -= 24;
        const infoBox = document.getElementById("routingControl");
        infoBox.style.top = infoRouteTop+'px';
    } 
    while (children.length > routingAddresses.length){
        //REMOVE A DIV
        container.children[1].remove();
        children = container.children;
        infoRouteTop += 24;
        const infoBox = document.getElementById("routingControl");
        infoBox.style.top = infoRouteTop+'px';
        
    }

    for (let i = 0; i < children.length; i++){
        // console.log(children[i]);
        // console.log(routingAddresses[i]);
        children[i].setAttribute("value", routingAddresses[i]);
    }
}

/**
 * Builds the query string from the waypoints and transportation mode
 * @returns {string}
 */
function routingWaypointsToQueryString(waypoints){
    console.log(waypoints.length);
    let queryString = '{"coordinates":[[';
    for(let i = 0; i < waypoints.length - 1; i++){
        const element = waypoints[i];
        queryString += element.lng + ',' + element.lat +'],[';
    }
    const lastElem = waypoints[waypoints.length - 1];
    queryString += lastElem.lng + ',' + lastElem.lat +']], "instructions":"false"}';
    // console.log(queryString);
    return queryString;
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

/**
 * Create a gradient for the outline of the itinerary
 */
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
function isochroneGlobal(type, value, units){
    if (areBracketsOn){
        polylineBracket.setStyle({opacity:0.4});
    }
    
    var points = getNeededPoints(polylineBracket.getLatLngs(), value, units); //Get all the points
    L.DomUtil.addClass(circleZoneOfInterest._path, "pulse"); //Circle pulse to indicate query is happening
    // console.log(points);
    if (points.length < 6){ // 5 points limit on the query
        var resIso = [];
        for (var i = 0; i < points.length; i++){
            let request = new XMLHttpRequest();

            let src = "https://api.openrouteservice.org/v2/isochrones/driving-car";
            // let src = "https://mapitin.lisn.upsaclay.fr:8890/ors/v2/isochrones/driving-car"
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
                    // console.log('Body:', this.response);
                    resIso.push(this.response.features);
                    // console.log("i : " + i + ", length : " + points.length);
                    // console.log(resIso);
                    
                    isochroneToPolygon(resIso, type, points.length); 
                }
            };

            const body = makeIsoQuery(points[i], value, units);
            // console.log(body);
            request.send(body);
        }
        // console.log(resIso); 
    } else {
        window.alert("Too many points do you really need 25 points???");
    }
} 

function isochronesLocal(type, value, units){
    L.DomUtil.addClass(circleZoneOfInterest._path, "pulse"); //Circle pulse to indicate query is happening
    // console.log(points);
    let request = new XMLHttpRequest();

    let src = "https://api.openrouteservice.org/v2/isochrones/driving-car";
    // let src = "https://mapitin.lisn.upsaclay.fr:8890/ors/v2/isochrones/driving-car"
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
            // console.log('Body:', this.response);
            // console.log("i : " + i + ", length : " + points.length);
            // console.log(resIso);
            
            isochroneToPolygon([this.response.features], type, 1); 
        }
    };

    // const body = makeIsoQuery(circleZoneOfInterest.getLatLng(), value, units);
    const point = circleZoneOfInterest.getLatLng();
    let body = '{"locations":[[' + point.lng + ',' + point.lat + ']],"range":[';
    if (units == "distance"){
        body+= value*1000;
    } else {
        body+= value*60;
    }
    body+= '],"range_type":"' + units + '"}';
    // console.log(body);
    request.send(body);
}
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
    // console.log(distValue);

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
    // console.log(queryString);
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
    // console.log(body);
    if (body.length == length){ //Check if it is the right length
        // console.log("long enough");
        disableCircle();
        L.DomUtil.removeClass(circleZoneOfInterest._path, "pulse");
        var polygons = []; //list of all the polygons from the results
        body.forEach(layerOne => { //each element has its own polygon
            layerOne.forEach(element => {
                var coords = element.geometry.coordinates[0];
                var latLngs = [];
                coords.forEach(element =>{
                    latLngs.push(L.latLng(element[1], element[0])); //Leaflet uses LatLng and OSR uses LngLat
                });
                // console.log(latLngs);
                
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
        
        // var diff = turf.difference(diffClose, rectOpenJSON);

        //LatLng
        var polyLatLngs = polygonToLatLng(union.geometry.coordinates[0]);
        // console.log("polygon length before simplify: " + polyLatLngs.length);

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
        // console.log("polygon length after simplify: " + polygon.length);

        //polygon
        var realZone = L.polygon(polygon, {color: 'blue', className:"pulse"}).addTo(map);
        queryZone = realZone; 

        updateSizeMarkers();
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
        // console.log("not long enough");
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
        // endPoint: "https://mapitin.lisn.upsaclay.fr/api/",
        markerIcon : greenIcon, //custom icon
        minZoomIndicatorEnabled : false,
        onSuccess: function(data) { 
            // console.log("ON SUCCESS");
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
                    // routing.spliceWaypoints(1, 0, marker.getLatLng()); //Add waypoint to route and reroute
                    geocoding(pos);
                    
                    map.closePopup();
                });

                //Create Preview Route button
                previewBtn = createButton('Preview route', popupContent);
                
                //Create Popup
                const popup = L.popup().setContent(popupContent);
                marker.bindPopup(popup);
                markers.push(marker); //Add marker to markers list
                
                L.DomEvent.on(previewBtn, 'click', function() { //On click of preview button
                    // routing.spliceWaypoints(1, 0, marker.getLatLng()); //Add waypoint to route and reroute
                    if (routingWaypoints < 3){
                        routingWaypoints.splice(1, 0, marker.getLatLng());
                        ORSRouting();
                    } else {
                        // firstRequest(marker.getLatLng());
                        whichWayIsFaster(latlng, address)
                    }
                    //Create new popup
                    const container =  L.DomUtil.create('div');
                    const okButton = createButton("Add to route", container);
                    L.DomEvent.on(okButton, 'click', function() {
                        //Reaplce popup with original one
                        geocoding(marker.getLatLng());
                        openedMarker.unbindPopup();
                        openedMarker.bindPopup(openedPopup);
                        map.closePopup();
                    });
                    const cancelButton = createButton("Cancel", container);
                    L.DomEvent.on(cancelButton, 'click', function() {
                        map.closePopup();
                        // routing.spliceWaypoints(1, 1); //Remove waypoint from the route and reroute
                        routingWaypoints.splice(1, 1);
                        ORSRouting();
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
            // console.log("WE ARE SETTING THE STATE TO RESULTS");
            state = "queryResults";
        },
        onError: function(xhr){
            console.log("error");
        },
        afterRequest: function()  {
            console.log("afterRequest");
            //Replace pulsing queryZone with non pulsing one
            L.DomUtil.removeClass(queryZone._path, "pulse");
            queryZone.setStyle({opacity:0, fillOpacity: 0.4, fillColor: '#1b1bff'});
            
            if(areBracketsOn){
                polylineBracket.setStyle({opacity:0}); //Hide highlight polyline
            }
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

/**
 * Sends a reverse geocoding request to ORS
 * @param {L.LatLng} latlng 
 */
function geocoding(latlng){
    var request = new XMLHttpRequest();
    let body = 'https://api.openrouteservice.org/geocode/reverse?api_key=5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f&point.lon=' + latlng.lng + '&point.lat='+ latlng.lat + '&layers=venue&boundary.country=FR'

    request.open('GET', body);

    request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');

    request.onreadystatechange = function () {
    if (this.readyState === 4) {
        console.log('Status:', this.status);
        console.log('Headers:', this.getAllResponseHeaders());
        // console.log('Body:', this.responseText);
        let adress = decodeGeocodingResults(this.response);
        console.log(adress);
        // console.log()
        if (routingWaypoints.length < 3){
            routingWaypoints.splice(1, 0, latlng);
            routingAddresses.splice(1,0,adress);
            ORSRouting();
        } else {
            // firstRequest(latlng, adress);
            whichWayIsFaster(latlng, adress)
        }
        // routingWaypoints.splice(1, 0, latlng);
        // ORSRouting();
    }
    };

    request.send();

}

/**
 * Takes the results of the reverse geocoding and selects the one to keep
 * @param {JSON} result 
 */
function decodeGeocodingResults(result){
    // console.log(JSON.parse(result));
    let jsonRes = JSON.parse(result);
    let features = jsonRes.features;
    return features[0].properties.label;
    // console.log(adress);
      
}

/**
 * Places the new waypoint where it is supposed to go for the route to be faster
 * @param {L.LatLng} latlng 
 * @param {String} address 
 */
function whichWayIsFaster(latlng, address){
    //find closest waypoints

    let dist = latlng.distanceTo(routingWaypoints[0]) ;
    let index = 0;
    for(let i = 0; i < routingWaypoints.length; i++){
        let currentDist = latlng.distanceTo(routingWaypoints[i]);
        if (currentDist < dist){
            dist = currentDist;
            index = i;
        }
    }

    let firstRoute = 0;
    let secondRoute = 0;
    for (let i = 0; i < routingWaypoints.length-1; i++){
        if (i == index-1){
            firstRoute += routingWaypoints[i].distanceTo(latlng);
            firstRoute += latlng.distanceTo(routingWaypoints[i+1]);
            secondRoute += routingWaypoints[i].distanceTo(routingWaypoints[i+1]);
        } else if (i == index){
            firstRoute += routingWaypoints[i].distanceTo(routingWaypoints[i+1]);
            secondRoute += routingWaypoints[i].distanceTo(latlng);
            secondRoute += latlng.distanceTo(routingWaypoints[i+1]);
        } else {
            firstRoute += routingWaypoints[i].distanceTo(routingWaypoints[i+1]);
            secondRoute += routingWaypoints[i].distanceTo(routingWaypoints[i+1]);
        }
    } 
    console.log("index: ", index, ", firstroute: ", firstRoute, ", secondRoute: ", secondRoute);
    if (index == 0){
        routingAddresses.splice(1, 0, address);
        routingWaypoints.splice(1, 0, latlng);
    } else if (firstRoute < secondRoute || index == routingWaypoints.length-1){
        routingAddresses.splice(index, 0, address);
        routingWaypoints.splice(index, 0, latlng);
    } else {
        routingAddresses.splice(index+1, 0, address);
        routingWaypoints.splice(index+1, 0, latlng);
    }
    ORSRouting();
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
        // markerBracketOpen.setIcon(bracket);
        // markerBracketClose.setIcon(bracket);
        if (state == "queryResults" && areBracketsOn){
            map.removeLayer(markerBracketOpen);
            map.removeLayer(markerBracketClose);
            markerBracketOpen = tempMarkerOpen;
            markerBracketClose = tempMarkerClose;
            markerBracketClose.addTo(map);
            markerBracketOpen.addTo(map);
        }
        if (areBracketsOn){
            markerBracketOpen.dragging.enable();
            markerBracketClose.dragging.enable(); 
            //Higlight polyline becomes visible again
    lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
    polylineBracket.setStyle({opacity:0.5});    
        }
        

    
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
    if(areBracketsOn){
        let rad = circleZoneOfInterest.getRadius()*0.8;
        let open = markerBracketOpen.getLatLng();
        var close = markerBracketClose.getLatLng();
        map.removeLayer(markerBracketOpen);
        map.removeLayer(markerBracketClose);
        tempMarkerOpen = markerBracketOpen;
        tempMarkerClose = markerBracketClose;
        markerBracketOpen = L.circle(open, {radius:rad, color: "#6D6D6D", fillOpacity: 1, fillColor: "#A9A9A9"}).addTo(map);
        markerBracketClose = L.circle(close, {radius:rad, color: "#6D6D6D", fillOpacity: 1, fillColor: "#A9A9A9"}).addTo(map);    
    }
   
    

    // markerBracketOpen.setIcon(bracketGreyed);
    // markerBracketClose.setIcon(bracketGreyed);

    // markerBracketOpen.dragging.disable();
    // markerBracketClose.dragging.disable();
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
    if ((distFromLine < 0.3 || distFromLine < 0.8 && closestPixel.x < point.x ) && areBracketsOn){
        let distFromHighlight = getDistanceInCM(latlng, point, polylineBracket.getLatLngs());
        if (distFromHighlight > 0.3 || distFromHighlight > 10 && closestPixel.y < point.y){
            // console.log("iti click");
            state = "itinerary";
            prevState = "itinerary";
            //Remove markers, highlight polyline, & markers' texts
            map.removeLayer(circleZoneOfInterest);
            if(areBracketsOn && markerBracketClose != null){
                map.removeLayer(markerBracketOpen);
                map.removeLayer(markerBracketClose);
                map.removeLayer(polylineBracket);
                
            }
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
            areBracketsOn = false;
        }
    } else {
        if (!clickOnCircle && (distFromLine < 0.3 || distFromLine < 0.8 && closestPixel.x < point.x )){
            state = "itinerary";
            prevState = "itinerary";
            map.removeLayer(circleZoneOfInterest);
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
    // console.log("iti");
    // let latlng = e.latlng;
    // let point = toPixels(latlng);
    // console.log("pointer down : " + isPointerDown + ", !movingbrackets: " + !isMovingBrackets + ", !movemarker: " + !isMovingMarker + ", !clickLayer: " + !clickOnLayer);
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
            console.log("WE ARE CHANGING THE POS");
            previousCirclePosition = closest; 
            // showFloatingTexts();
            // updateMarkerTextPos();

            updateCircleText();

            // circleClosest.bringToFront();
            // createsBrackets(latlng);
            // circleZoneOfInterest.dragging.enable()

            var circleHTML = circleZoneOfInterest._path;
            circleHTML.onpointerup= function(e){
                console.log("ONPOINTERUP DU CIRCLE");
                const millis = Date.now() - startTime;
                if ((millis / 1000) < 0.3){
                    if(areBracketsOn){
                        bracketsQuery();
                    } else   {
                        openMenu();
                    }
                }
            };
            circleHTML.onpointerdown = function(e){clickOnCircle = true};
            if (queryZone != null){
                map.removeLayer(queryZone);
            }

            if (isElevationDisplayed || isRestaurantDisplayed || isFuelDisplayed || isSupermarketDisplayed){
                console.log("a layer is displayed");
                createBrackets(latlng);
            }
            
            
        if (!isFuelDisplayed && !isRestaurantDisplayed && !isElevationDisplayed && !isSupermarketDisplayed){
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
        console.log("dans la boucle");
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
        console.log("here we set the visibility to visible");
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

function bracketsQuery(){

    if (isRestaurantDisplayed){
        makeQuery("'amenity' = 'restaurant'"); 
    } else if (isSupermarketDisplayed){
        makeQuery("'shop' = 'supermarket'");
    } else if (isFuelDisplayed){
        if (transportationMode == "car"){
            makeQuery("'amenity' = 'fuel'");
        } else{
            makeQuery("'shop' = 'bakery'");
        }
    }
}

//Builds the string for the query and makes the query
function makeQuery(type){
    disableCircle();
    let queryString = "";
    let distValue;
    if (transportationMode=="car"){
        distValue = 500;
    } else {
        distValue = 50;
    }
    
    let polygon = itineraryPass(polylineBracket.getLatLngs(), distValue);
    queryString = arrayToQuery(polygon, type);

    console.log(queryString);
    oplQuery(queryString);
}

function itineraryPass(itinerary, distValue){
    
    var dist = 0;
    var polygon = [];
    var prevPoint = itinerary[0];
    var forstPoint;
    var isVerticaal = isVertical(toPixels(markerBracketClose.getLatLng()), toPixels(markerBracketOpen.getLatLng()), 0.5);
    for (var i = 0; i < itinerary.length - 1; i++){
        dist += itinerary[i].distanceTo(itinerary[i+1]);
        if (dist > distValue*3){
            if (forstPoint == null){
                forstPoint = itinerary[i+1];
            }
            // var circleColor;
            
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
    if (isVerticaal){
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
    if (isVerticaal){
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
        setSliderMinMax(isInKM, range);
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
    // var value = getDistPolyLine(polylineBracket.getLatLngs());
    // let value = distance/3;
    slider.setAttribute("step", 1);
    if (isKiloMeter){
        let value = distance/1000;
        value = value/3;
        
        if (transportationMode == "foot"){
            slider.setAttribute("step", 0.1);
            var min = Math.round((value/5)*10)/10;
            value = Math.round(value*10)/10;
            if (value > 5){
                value = 5;
                min = 0.1;
            }
            console.log("value: " + value);
            console.log("min: " + min);
            console.log("max: " + value);
            let mid = Math.round((min + (value-min)/2)*10)/10;
            console.log("mid: " + mid);
            slider.value = mid;
            slider.setAttribute("min", min);
            slider.setAttribute("max", value);
            let text = document.getElementById("value");
            text.innerHTML = mid;
        } else {
            var min = Math.round(value/5);
            if (value > 50){
                value = 50;
                min = 20;
            }
            let mid = (min + (value-min)/2);
            slider.value = mid;
            slider.setAttribute("min", min);
            slider.setAttribute("max", value);
            let text = document.getElementById("value");
            text.innerHTML = mid;
        }
        
        
    } else {
        let value = time/3;
        let inMinutes = Math.round(value/60);
        // var percent = Math.round(((100*value)/(distance/1000))*100)/100;
        // var percTime = (percent*time )/100;
        // console.log("% time" + percTime);
        // var inMinutes = Math.round(percTime/60);
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
        let mid = (min + (max-min)/2);
        slider.value = mid;
        let text = document.getElementById("value");
        text.innerHTML = mid;

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
    // console.log(Math.round(dist/1000));
    return Math.round(dist/1000);

}

/**
 * Handles click on the Go button: starts the isochrone query
 * @param {string} type 
 */
function clickGoButton(type){
    state = "loadingQuery";
    var sliderDiv = document.getElementById("slider");
    sliderDiv.style.visibility = "hidden";
    clickOnSlider = false;
    if (isInKM){
        // makeQuery(type, getSliderValue());
        // isochroneGlobal(type, getSliderValue(), "distance");
        isochronesLocal(type, getSliderValue(), "distance");
    } else {
        // isochroneGlobal(type, getSliderValue(), "time");
        isochronesLocal(type, getSliderValue(), "time");
    }

}

/**
 * Returns the current value of the slider
 * @returns {number}
 */
function getSliderValue(){
    var value = document.getElementById("range").value;
    // console.log(value);
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
        let length = allPos.length;
        if (transportationMode == "car"){

            const pos1 = turf.along(itineraryJSON,0).geometry.coordinates;
            const pos2 = turf.along(itineraryJSON,(distance*2/8)/1000).geometry.coordinates;
            const pos3 = turf.along(itineraryJSON,(distance*3/8)/1000).geometry.coordinates;
            const pos6 = turf.along(itineraryJSON,(distance*6/8)/1000).geometry.coordinates;

            const latlng1 = L.latLng(pos1[1], pos1[0]);
            const latlng2 = L.latLng(pos2[1], pos2[0]);
            const latlng3 = L.latLng(pos3[1], pos3[0]);
            const latlng6 = L.latLng(pos6[1], pos6[0]);

            var marker1 = L.marker(getWeatherPos(latlng1, 1), {icon: weatherRainy});
            var marker2 = L.marker(getWeatherPos(latlng2, 2), {icon: weatherCloudSun});
            var marker3 = L.marker(getWeatherPos(latlng3, 3), {icon: weatherCloudy});
            var marker6 = L.marker(getWeatherPos(latlng6, 6), {icon: weatherCloudSun});

            var line1 = L.polyline([marker1.getLatLng(), latlng1], {color:"black", weigth:1}).addTo(map);
            var line2 = L.polyline([marker2.getLatLng(), latlng2], {color:"black", weigth:1}).addTo(map);
            var line3 = L.polyline([marker3.getLatLng(), latlng3], {color:"black", weigth:1}).addTo(map);
            var line6 = L.polyline([marker6.getLatLng(), latlng6], {color:"black", weigth:1}).addTo(map);
            // var line6 = L.polyline([marker6.getLatLng(), allPos[Math.floor(length*(7/8))]], {color:"black", weigth:1}).addTo(map);

            weatherLayerGroup = L.layerGroup([marker1, marker2, marker3, marker6 ]).addTo(map);
            weatherLayerGroupLines = L.layerGroup([line1, line2, line3, line6]).addTo(map);
        } else {
            var marker1 = L.marker(getWeatherPos(allPos[Math.floor(length*(1/8))], 1), {icon: weatherRainy});
            var marker2 = L.marker(getWeatherPos(allPos[Math.floor(length*(7/8))], 2), {icon: weatherCloudy});

            var line1 = L.polyline([marker1.getLatLng(), allPos[Math.floor(length*(1/8))]], {color:"black", weigth:1}).addTo(map);
            var line2 = L.polyline([marker2.getLatLng(), allPos[Math.floor(length*(7/8))]], {color:"black", weigth:1}).addTo(map);

            weatherLayerGroup = L.layerGroup([marker1, marker2]).addTo(map);
            weatherLayerGroupLines = L.layerGroup([line1, line2]).addTo(map);
        }
        isWeatherDisplayed = true;
        updatePositions();
        document.getElementById("weatherLayer").classList.add('selectedLayer');
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
    if (isVertical(toPixels(allPos[Math.floor(length*((index-1)/8))]), toPixels(allPos[Math.floor(length*(index/8))]), 0.03)){
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
        // if (isVertical(prevPoint, closestXY, 0.03)){
            // newXY = L.point((closestXY.x-60), closestXY.y);
        // } else {
            newXY = L.point(closestXY.x, (closestXY.y+60));
        // }
        var newLatLng = map.containerPointToLatLng(newXY);
        layers[i].setLatLng(newLatLng);
        prevPoint = closestXY;
        lines[i].setLatLngs([newLatLng, closest]);
    }
    closestWeatherIcon();


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

/**
 * Calculates on which portion of the itinerary we are accoridng to the weather
 */
function closestWeatherIcon(){
    const bounds = map.getBounds();
    const latlngCenter = L.latLng(bounds.getCenter().lat, bounds.getNorthEast().lng);
    let fraction = L.GeometryUtil.locateOnLine(map, itinerary, L.GeometryUtil.closest(map, allPos, latlngCenter));
    
    
    if (fraction > (6/8)){
        // console.log("SIX");
        const pos6 = turf.along(itineraryJSON,(distance*6/8)/1000).geometry.coordinates;
        const latlng6 = L.latLng(pos6[1], pos6[0]);
        // L.circle(L.GeometryUtil.closest(map, allPos, latlngCenter), {radius:110, color:"red"}).addTo(map);
        weatherIconMove(weatherLayerGroup.getLayers()[3], weatherLayerGroupLines.getLayers()[3], latlng6);
    } else if (fraction > (3/8)){
        // console.log("THREE");
        const pos3 = turf.along(itineraryJSON,(distance*3/8)/1000).geometry.coordinates;
        const latlng3 = L.latLng(pos3[1], pos3[0]);
        // L.circle(L.GeometryUtil.closest(map, allPos, latlngCenter), {radius:110, color:"green"}).addTo(map);
        weatherIconMove(weatherLayerGroup.getLayers()[2], weatherLayerGroupLines.getLayers()[2], latlng3);

    } else if (fraction > (2/8)){
        // console.log("TWO");
        const pos2 = turf.along(itineraryJSON,(distance*2/8)/1000).geometry.coordinates;
        const latlng2 = L.latLng(pos2[1], pos2[0]);
        // L.circle(L.GeometryUtil.closest(map, allPos, latlngCenter), {radius:110, color:"black"}).addTo(map);
        weatherIconMove(weatherLayerGroup.getLayers()[1], weatherLayerGroupLines.getLayers()[1], latlng2);

    } else{
        // console.log("ONE");
        const pos1 = turf.along(itineraryJSON,0).geometry.coordinates;
        const latlng1 = L.latLng(pos1[1], pos1[0]);
        // L.circle(L.GeometryUtil.closest(map, allPos, latlngCenter), {radius:110}).addTo(map);
        weatherIconMove(weatherLayerGroup.getLayers()[0], weatherLayerGroupLines.getLayers()[0], latlng1);
    }
}

/**
 * Fets the quadrant the icon is in and sets new positions
 * @param {L.marker} icon 
 * @param {L.Polyline} line 
 * @param {L.LatLng} latlng 
 */
function weatherIconMove(icon, line, latlng){
    // let latlng = icon.getLatLng();
    let bounds = map.getBounds();
    let center = bounds.getCenter();
    let SW = bounds.getSouthWest();
    let SE = bounds.getSouthEast();
    let NW = bounds.getNorthWest();
    let NE = bounds.getNorthEast();
    let SWP = toPixels(SW);
    let SEP = toPixels(SE);
    let NWP = toPixels(NW);
    let NEP = toPixels(NE);
    let posPixels = toPixels(latlng);
    let oldLatlng = icon.getLatLng();

    if (posPixels.x < SWP.x){
        let lineCenter = turf.lineString([[center.lng, center.lat], [latlng.lng, latlng.lat]]);
        let lineWest = turf.lineString([[SW.lng, SW.lat], [NW.lng, NW.lat]]);
        let intersects = turf.lineIntersect(lineCenter, lineWest);   
        if (intersects.length == 0){
            if (posPixels.y < NWP.y){
                let intPixels = getIntersection (center, latlng, NW, NE);
                intPixels.y = intPixels.y+30;
                updateLineAndPos(intPixels, line, oldLatlng, icon);
            } else if (posPixels.y > SWP.y){
                let intPixels = getIntersection (center, latlng, SW, SE);
                intPixels.y = intPixels.y-30;
                updateLineAndPos(intPixels, line, oldLatlng, icon);
            }
        } else {
            let intJSON = intersects.features[0].geometry.coordinates;
            let intPixels = toPixels(L.latLng(intJSON[1], intJSON[0]));
            intPixels.x = intPixels.x+15;
            updateLineAndPos(intPixels, line, oldLatlng, icon);
        }
    } else if (posPixels.x > SEP.x){
        let lineCenter = turf.lineString([[center.lng, center.lat], [latlng.lng, latlng.lat]]);
        let lineEast = turf.lineString([[SE.lng, SE.lat], [NE.lng, NE.lat]]);
        let intersects = turf.lineIntersect(lineCenter, lineEast);
        if (intersects.length == 0){
            if (posPixels.y < NWP.y){
                let intPixels = getIntersection (center, latlng, NW, NE);
                intPixels.y = intPixels.y+30;
                updateLineAndPos(intPixels, line, oldLatlng, icon);
            } else if (posPixels.y > SWP.y){
                let intPixels = getIntersection (center, latlng, SW, SE);
                intPixels.y = intPixels.y-30;
                updateLineAndPos(intPixels, line, oldLatlng,icon);
            }

        } else {
            let intJSON = intersects.features[0].geometry.coordinates;
            let intPixels = toPixels(L.latLng(intJSON[1], intJSON[0]));
            intPixels.x = intPixels.x-30;
            updateLineAndPos(intPixels, line, oldLatlng,icon);  
        }
    } else if (posPixels.y < NWP.y){
        let intPixels = getIntersection (center, latlng, NW, NE);
        intPixels.y = intPixels.y+30;
        updateLineAndPos(intPixels, line, oldLatlng,icon);
    } else if (posPixels.y > SWP.y){
        let intPixels = getIntersection (center, latlng, SW, SE);
        lintPixels.y = intPixels.y-30;
        updateLineAndPos(intPixels, line, oldLatlng, icon);

    }
}

/**
 * Updates the icon and line positions
 * @param {L.Point} intPixels 
 * @param {L.Polyline} line 
 * @param {L.latLng} oldLatlng 
 * @param {L.marker} icon 
 */
function updateLineAndPos(intPixels, line, oldLatlng, icon){
    const intLatLng = toLatLng(intPixels);
    // console.log("before", line.getLatLngs());
    icon.setLatLng(intLatLng);
    const lineCoords = line.getLatLngs();
    if (lineCoords[0] == oldLatlng){
        line.setLatLngs([intLatLng, lineCoords[1]]);
    } else {
        line.setLatLngs([intLatLng, lineCoords[0]]);
    }
    // console.log("after", line.getLatLngs());
}

/**
 * Returns the intersection between the line[center, latlng] and the line [coord1, coord2]
 * @param {L.LatLng} center 
 * @param {L.LatLng} latlng 
 * @param {L.LatLng} coord1 
 * @param {L.LatLng} coord2 
 * @returns {L.Point}
 */
function getIntersection (center, latlng, coord1, coord2){
    const lineCenter = turf.lineString([[center.lng, center.lat], [latlng.lng, latlng.lat]]);
    const lineNorth = turf.lineString([[coord1.lng, coord1.lat], [coord2.lng, coord2.lat]]);
    const intersects = turf.lineIntersect(lineCenter, lineNorth);
    const intJSON = intersects.features[0].geometry.coordinates;
    return toPixels(L.latLng(intJSON[1], intJSON[0]));

}

/********************************************************************************
 *                                   Brackets                                   *
 ********************************************************************************/

/**
 * Create the HTML Floating texts elements
 */
function createFloatingTexts(){
    console.log("create floating texts");
    let ETAFloatingText=document.createElement('div');
    ETAFloatingText.style.zIndex = 500;
    ETAFloatingText.style.visibility='hidden';
    ETAFloatingText.setAttribute("class", "floatingText");

    ETAFloatingText.id="cursorText"; 

    document.body.appendChild(ETAFloatingText);

    let bracketOpenText=document.createElement('div');
    bracketOpenText.style.zIndex = 400;
    bracketOpenText.style.visibility='hidden';
    bracketOpenText.id="bracketText";
    bracketOpenText.setAttribute("class", "floatingText");
    bracketOpenText.onclick = function(e){toggleFloatingTextsUnits();}
    document.body.appendChild(bracketOpenText);

    let bracketCloseText=document.createElement('div');
    bracketCloseText.style.zIndex = 400;
    bracketCloseText.style.visibility='hidden';
    bracketCloseText.id="bracketCloseText";
    bracketCloseText.setAttribute("class", "floatingText");
    bracketCloseText.onclick = function(e){toggleFloatingTextsUnits();}
    document.body.appendChild(bracketCloseText);

    let circleMarkerText=document.createElement('div');
    circleMarkerText.style.zIndex = 400;
    circleMarkerText.style.visibility='hidden';
    circleMarkerText.id="circleText";
    circleMarkerText.setAttribute("class", "floatingText");
    circleMarkerText.onclick = function(e){toggleFloatingTextsUnits();}
    document.body.appendChild(circleMarkerText);
}

/**
 * Toggles between distance and time for the floating texts
 */
function toggleFloatingTextsUnits(){
    console.log("toggle; isKM: ", isFloatingTextKM);
    let circleMarkerText = document.getElementById("circleText");
    let bracketOpenText = document.getElementById("bracketText");
    let bracketCloseText = document.getElementById("bracketCloseText");
    if (isFloatingTextKM){ //change to time
        
        circleMarkerText.innerHTML = getTimeFromDistance(circleZoneOfInterest.getLatLng());
        if(areBracketsOn){
            bracketOpenText.innerHTML = getTimeFromDistance(markerBracketOpen.getLatLng());
            bracketCloseText.innerHTML = getTimeFromDistance(markerBracketClose.getLatLng());
            
        }
        isFloatingTextKM = false;
    } else { //change to distance
        circleMarkerText.innerHTML = distToString(getDistanceFromStartLine(circleZoneOfInterest.getLatLng(), allPos), (transportationMode=="foot"));
        if(areBracketsOn){
            updateBracketCloseText();
            updateBracketOpenText();
        }
        isFloatingTextKM = true;
    }
}

/**
 * Takes the distance and turns it into a string with the unit; rounded to 0.1 or not
 * @param {Number} dist 
 * @param {Boolean} rounded 
 * @returns {String}
 */
function distToString(dist, rounded){
    if (rounded){
         return (Math.round(dist/100)/10+"km") 
    } else {
        return (Math.round(dist/1000)+"km");
    }
    
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
        // console.log("percent: " + percent);
        // console.log("% time: " + percent*time/100)
        let body = inHours(percent*time/100) + "<br>";
        if (transportationMode == "car"){
            body+= Math.round(dist/1000) +"km";
        } else {
            body+= (Math.round(dist/100)/10) +"km";
        }
        ETAFloatingText.innerHTML=body;
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
    console.log("show floating texts");
    let bracketOpenText = document.getElementById("bracketText");
    let bracketCloseText = document.getElementById("bracketCloseText");
    let circleMarkerText = document.getElementById("circleText");

    bracketOpenText.style.visibility = 'visible';
    bracketCloseText.style.visibility = 'visible';
    circleMarkerText.style.visibility = 'visible';

    updateMarkerTextPos();
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
    pointsToKeep.splice(0, 0, latlngAbove);
    pointsToKeep.push(latlngBelow);
    if (polylineBracket != null){
        map.removeLayer(polylineBracket);
    }
    
    polylineBracket = L.polyline(pointsToKeep, {color: 'blue', weight: 48, opacity: 0.5, lineCap: 'butt'}).addTo(map);

    circleZoneOfInterest.bringToFront()
}

/**
 * Spawns the range markers
 * @param {PointerEvent} event 
 */
function createBrackets(event){
    //greys out rest
    //make bracket appear
    if (markerBracketClose != null && markerBracketOpen != null){
        map.removeLayer(markerBracketClose);
        map.removeLayer(markerBracketOpen);
        map.removeLayer(polylineBracket);
    }

    areBracketsOn = true;
    
    let closest = L.GeometryUtil.closest(map, allPos, event); //get the closest point on the line
    let dist = getDistanceFromStartLine(closest, allPos);
    let percent = dist*100/distance; //get it in %
    let timeDiffInPercent = defaultBracketRange*100/time; //get the time diff between the brackets in % 
    let percentAbove = percent - timeDiffInPercent; 
    let distAbove = (percentAbove*distance)/100;
    let percentBelow = percent + timeDiffInPercent;
    let distBelow = (percentBelow*distance)/100;
    
    //Create Marker Open
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
                        // updateMarkersRotation(markerBracketClose, false);
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
                            updatePosTexts(bracketCloseText, markerBracketClose, isVertical(toPixels(markerBracketClose.getLatLng()), toPixels(circleZoneOfInterest.getLatLng()), 0.1));
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
                        // updateMarkersRotation(markerBracketOpen, true);
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
                            updatePosTexts(bracketOpenText, markerBracketOpen, isVertical(toPixels(markerBracketOpen.getLatLng()), toPixels(circleZoneOfInterest.getLatLng()), 0.1));
                            updateBracketOpenText();
                            var latLngs = polylineBracket.getLatLngs();
                            // updateMarkersRotation(markerBracketOpen, true);
                        } else {
                            markerBracketOpen.dragging.disable();
                        }
                        
                    }
                   
                })

    
    //Set floating texts
    updateBracketOpenText();
    updateBracketCloseText();

    let circleMarkerText = document.getElementById("circleText");
    circleMarkerText.innerHTML=(dist/1000).toFixed(0) + "km";

    showFloatingTexts()

    //Set floating texts positions
    updateMarkerTextPos();

    //Draw the highlight line
    lineBracketsHighlight(latlngAbove, latlngBelow);
}

/**
 * Updates the range markers' texts positions
 * @param {HTMLElement} text 
 * @param {*} element 
 * @param {boolean} isVert 
 */
function updatePosTexts(text, element, isVert){
    
    if (element != null){
        // console.log("UPSDATE");
        // console.log(element.getLatLng());
        if (isVert){
            // console.log("vert");
            var left = toPixels(element.getLatLng()).x-80;
            var top = toPixels(element.getLatLng()).y-5;
            var textSize=[text.offsetWidth,text.offsetHeight];
            if (left + textSize[0] < 0){
                left = left + 160;
            }
            text.style.left=left+'px';
            text.style.top=top+'px';
            
        } else{
            var left = toPixels(element.getLatLng()).x-15;
            var top = toPixels(element.getLatLng()).y-50;
            var textSize=[text.offsetWidth,text.offsetHeight];
            if (top + textSize[1] < 0){
                top = top + 100;
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

    let closestAbove = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
    isPointOnLine(closestAbove, allPos, 0.5);
    let pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    let closestBelow = L.GeometryUtil.closest(map, allPos, L.GeometryUtil.closest(map, allPos, markerBracketClose.getLatLng()));
    isPointOnLine(closestBelow, allPos, 0.5);
    
    let pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    let distCircleBracket = 0;
    for (let i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
        distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
    }
    let bracketCloseText = document.getElementById("bracketCloseText");
    bracketCloseText.innerHTML="+ " + (distCircleBracket/1000).toFixed(fix) +" km";

    closeCircleDist = distCircleBracket;
}

/**
 * Update text from the open range marker
 */
function updateBracketOpenText(){
    let fix = 0;
    if (transportationMode == "foot"){fix = 1;}
    let closestAbove = L.GeometryUtil.closest(map, allPos, markerBracketOpen.getLatLng());
    isPointOnLine(closestAbove, allPos, 0.5);
    let pointsAbove = new Array();
    points.forEach(element => {pointsAbove.push(element)});
    let closestBelow = L.GeometryUtil.closest(map, allPos, circleZoneOfInterest.getLatLng());
    isPointOnLine(closestBelow, allPos, 0.5);
    
    let pointsToKeep = points.filter(n => !pointsAbove.includes(n));
    let distCircleBracket = 0;
    for (let i = 0; i < pointsToKeep.length - 1; i++){ //calculate the distance from the start to this point
        distCircleBracket += pointsToKeep[i].distanceTo(pointsToKeep[i+1]);
    }
    
    let bracketOpenText = document.getElementById("bracketText");
    bracketOpenText.innerHTML="- " + (distCircleBracket/1000).toFixed(fix) +" km";

    openCircleDist = distCircleBracket;
}

/**
 * Handles the moving of the markers when dragging the middle marker
 * @param {L.LatLng} latlng 
 */
function moveMarkers(latlng){
    // console.log("movemarkers");
    // console.log(state);
    if( clickOnCircle && (state == "circleMove" || state == "pointPlaced")){

        let limit = 0.05;
        if (map.getZoom() > 10){
            limit = 0.02;
        }
        
        state = "circleMove";
        // console.log("stateChanged");
        let prevCirclePose = circleZoneOfInterest.getLatLng(); //store the previous circle pos

        // //Set the middle range marker position
        let currentCirclePos = L.GeometryUtil.closest(map, allPos, latlng);
        circleZoneOfInterest.setLatLng(currentCirclePos);

        const prevCirclePixels = toPixels(prevCirclePose);
        const curentCirclePixel = toPixels(currentCirclePos);
        let distPixels = ((prevCirclePixels.distanceTo(curentCirclePixel))*2.54)/(ppi/window.devicePixelRatio);
       
        if (distPixels > limit && areBracketsOn){
            let distPrev = getDistanceFromStartLine(prevCirclePose, allPos);
            let distAct = getDistanceFromStartLine(currentCirclePos, allPos);;
            let distActPrevCircle = distAct-distPrev; //distance between actual and previous positions along the line 
        
            let openFirstDist = distAct - openCircleDist;
            let newOpenCircleDist = openFirstDist + distActPrevCircle;

            let closeFirstDist = distAct + closeCircleDist;
            let newCloseCircleDist = closeFirstDist + distActPrevCircle;

            let pointOpen = turf.along(itineraryJSON, newOpenCircleDist/1000).geometry.coordinates;
            let pointClose = turf.along(itineraryJSON, newCloseCircleDist/1000).geometry.coordinates;

            let latLngOpen = L.latLng(pointOpen[1], pointOpen[0]);
            let latLngClose = L.latLng(pointClose[1], pointClose[0]);

            markerBracketOpen.setLatLng(latLngOpen);
            markerBracketClose.setLatLng(latLngClose);

            //Update line highlight and texts and texts positions
            lineBracketsHighlight(markerBracketOpen.getLatLng(), markerBracketClose.getLatLng());
            updateMarkerTextPos();
            // updateBracketCloseText();
            // updateBracketOpenText();
        } 
        updateCircleText();
            
        state = "circleMove";
        // console.log("WE ARE CHANGING THE POS");
        previousCirclePosition = currentCirclePos;
    }
}

/**
 * Update the range markers positions
 */
function updateMarkerTextPos(){
    // console.log("update marker text pos");
    let circleMarkerText = document.getElementById("circleText");
    updatePosTexts(circleMarkerText, circleZoneOfInterest, (transportationMode=="foot"));
    if (areBracketsOn){
        let bracketOpenText = document.getElementById("bracketText");
        let bracketCloseText = document.getElementById("bracketCloseText");
        

        // let vert = isVertical(toPixels(markerBracketOpen.getLatLng()), toPixels(markerBracketClose.getLatLng()),0.5);
        let vert = transportationMode=="foot";
        updatePosTexts(bracketCloseText, markerBracketClose, vert);
        updatePosTexts(bracketOpenText, markerBracketOpen, vert);
        
    }
}

/**
 * Makes sure the circle markers are never bigger than the queryZone
 */
function updateSizeMarkers(){
    let zoneBounds = queryZone.getBounds();
    let distanceEW = zoneBounds.getSouthWest().distanceTo(zoneBounds.getSouthEast());
    let distanceNS = zoneBounds.getSouthWest().distanceTo(zoneBounds.getNorthWest());
    // L.marker(zoneBounds.getSouthWest()).addTo(map);
    // L.marker(zoneBounds.getNorthWest()).addTo(map);
    // console.log()
    let radius;
    if (distanceEW < distanceNS){
        radius = distanceEW/2;
    } else {
        radius = distanceNS/2;
    }
    console.log("Radius: " + radius);
    if (radius < circleZoneOfInterest.getRadius){
        circleZoneOfInterest.setRadius(radius);
        markerBracketClose.setRadius(radius*0.8);
        markerBracketOpen.setRadius(radius*0.8);
    }
}

/**
 * Updates the text of the circle marker according to the unit
 */
function updateCircleText(){
    let circleMarkerText = document.getElementById("circleText");
    if (isFloatingTextKM){
        let dist = getDistanceFromStartLine(circleZoneOfInterest.getLatLng(), allPos);
        circleMarkerText.innerHTML = distToString(dist, (transportationMode == "foot"));
    } else { 
        circleMarkerText.innerHTML = getTimeFromDistance(circleZoneOfInterest.getLatLng());
    }
}

/********************************************************************************
 *                                  Utilities                                   *
 ********************************************************************************/

/**
 * Calculates the time from the point to the start of the line according the the distance
 * @param {L.LatLng} latlng 
 * @returns {String}
 */
function getTimeFromDistance(latlng){
    let dist = getDistanceFromStartLine(latlng, allPos);
    let percent = dist*100/distance;
    // if (transportationMode == "car"){
    console.log(inHours(percent*time/100));
    return inHours(percent*time/100);
    // } else {
    //     Math.round(dist/100)/10;
    // }
}

/**
 * Calculates the distance between a point on the line and the start of the line
 * @param {L.LatLng} latlng 
 * @param {L.LatLng[]} line 
 * @returns {Number}
 */
function getDistanceFromStartLine(latlng, line){
    isPointOnLine(latlng, line, 5)  
    points.push(latlng);

    let dist = 0;
    for (let i = 0; i < points.length - 1; i++){
        dist += points[i].distanceTo(points[i+1]);
    }

    return dist;
}

/**
 * 
 * @param {L.Point[]} line Array in Point(x,y) 
 * @returns {L.LatLng[]} Array in LatLng(lat,lng)
 */
function pointToLatLng(line){
    var res = [];
    line.forEach(element => {
        res.push(map.containerPointToLatLng(element));
    });
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
    });
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

function toLatLng(point){
    return map.containerPointToLatLng(point);
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
 * Checks if the segment between A and B is more vertical or horizontal
 * @param {L.Point} pointA Point(x,y)
 * @param {L.Point} pointB Point(x,y)
 * @param {Number} precision
 * @returns {boolean}
 */
function isVertical(pointA, pointB, precision){
    if ((pointB.y - pointA.y) == 0){
        return false;
    } else if (pointB.x - pointA.x == 0){
        return true;
    } else {
        var coeff = Math.abs((pointB.y - pointA.y)/(pointB.x - pointA.x));
        // console.log(coeff);
        return coeff > precision;
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
    // var now = new Date();
    // var now_hour = now.getHours();
    // var now_min = now.getMinutes();
    // console.log("now hour: " + now_hour + "now min: " + now_min);
    const now_hour = 10;
    const now_min = 30;
    const time_mins = Math.floor(time/60);
    const time_hours = Math.floor(time_mins/60);
    const rest = Math.floor(time_mins - (60*time_hours));
    let add = 0;
    let in_minutes = now_min + rest;
    while(in_minutes >= 60) {
        in_minutes = in_minutes - 60;
        add ++;
    }
    let in_hours = now_hour + time_hours + add;
    if (in_hours >= 24){
        in_hours = in_hours - 24;
    }
    return (in_hours + "h" + in_minutes);


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

/**
 * Redraws the itinerary after a change of viewport to fix the mask disappearing
 */
function forceRedraw(){
    // if(needRedraw){        
        // console.log("WE ARE REDRAWING SIR WE ARE DELETING EVERYTHING AND REDRAWING EVERYTHGN");
        const bounds = map.getBounds();
        // map.fitBounds(stroke.getBounds());
        map.fitBounds(bounds.pad(-0.5));
        reroute();
        map.fitBounds(bounds);
        // needRedraw = false;
    // }
}
  
/**
 * Switch between the transporation modes (car/foot)
 */
function switchMode(){
    let fuel = document.getElementById("gasstation");
    let fuelLayer = document.getElementById("gasstationLayer");
    hideLayers();
    
    switch (transportationMode){
        case "foot":
            routingAddresses = [];
            addressCar.forEach( (element) => {routingAddresses.push(element)});
            routingWaypoints.length = 0;
            coordsCar.forEach( (element) => {routingWaypoints.push(element)});
            // routingWaypoints = coordsCar;
            defaultBracketRange = 1200;
            transportationMode = "car";
            fuel.setAttribute("src", "icons/fuelIcon.svg");
            fuelLayer.setAttribute("src", "icons/fuelIcon.svg");
           break; 
        case "car":
            // routingAddresses = addressFoot;
            // routingWaypoints = coordsFoot;
            routingAddresses = [];
            addressFoot.forEach( (element) => {routingAddresses.push(element)});
            routingWaypoints.length = 0;
            coordsFoot.forEach( (element) => {routingWaypoints.push(element)});
            defaultBracketRange = 300;
            transportationMode = "foot";
            fuel.setAttribute("src", "icons/bakery.svg");
            fuelLayer.setAttribute("src", "icons/bakery.svg");
           break; 
    }
    // console.log("WE ARE CHANGING THE STATE !!!");
    state = "itinerary";
    prevState = "itinerary";
    ORSRouting();

}

/**
 * Hids all the layers for a reroute
 */
function hideLayers(){

    clearQueryResults();

    if (circleZoneOfInterest != null){
        map.removeLayer(circleZoneOfInterest);
        if(areBracketsOn){
            map.removeLayer(markerBracketOpen);
            map.removeLayer(markerBracketClose);
            map.removeLayer(polylineBracket);    
        }
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

/**
 * Toggles the visibility of the route info panel
 */
function toggleRouteInfoVisibility(){
    let container = document.getElementById("routingControl");
    if(container.style.visibility == 'visible'){
        container.style.visibility = "hidden";
    } else {
        container.style.visibility = "visible";
    }
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
    needRedraw = true;
    // console.log("zoomed");
    
    // if (zoom > 14){
    //     itinerary.setStyle({weight : 8*(zoom-13)}); //keep the itinerary always bigger than road 
    // } else {
    //     itinerary.setStyle({weight : 8});
    // }
    // outline.setStyle({weight:48});

    if (circleZoneOfInterest != null /*&& (state == "pointPlaced" || state == "menu" || state == "slider")*/){
        zoomMult = 1280000/(Math.pow(2,zoom));
        circleZoneOfInterest.setRadius(zoomMult);
        if ((state == "queryResults" || state == "loadingQuery") && areBracketsOn){
            
            markerBracketOpen.setRadius(zoomMult*0.8);
            markerBracketClose.setRadius(zoomMult*0.8);
            updateSizeMarkers();
        }
        // console.log("zoom level: " + zoom + ", circle radius: " + circleZoneOfInterest.getRadius());

    }
})

onpointerdown = (event) => {
    startTime = Date.now();
    isPointerDown = true;
    prevZoom = map.getZoom();
    if ((state == "menu" || state == "slider") && areBracketsOn){
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
    // console.log(state);
    // console.log(event.target);
    // Get the pointer coords
    let ETAFloatingText = document.getElementById("cursorText");
    ETAFloatingText.style.visibility='hidden';
    var point = L.point(event.clientX, event.clientY);
    var latlng = map.containerPointToLatLng(point);
    // console.log("!clickMenu: " + !clickOnMenu + ", !movemap: " + !isMovingMap);
    if (state == "menu" && !clickOnCircle && !clickOnMenu && !isMovingMap && (prevZoom == map.getZoom())){
        console.log("perhaps we arrive here");
        var menuDiv = document.getElementById("menu");
        menuDiv.style.visibility = "hidden";
        state = "pointPlaced";
        if (areBracketsOn){
            markerBracketClose.dragging.enable();
            markerBracketOpen.dragging.enable();
        
        }
        clickOnMenu = false;
    } else if (state == "slider" && !clickOnSlider && !isMovingMap  && (prevZoom == map.getZoom())){
        var sliderDiv = document.getElementById("slider");
        sliderDiv.style.visibility = "hidden";
        state = "pointPlaced";
        if (areBracketsOn){
            markerBracketClose.dragging.enable();
            markerBracketOpen.dragging.enable();
        }
        clickOnSlider = false;
    } else if (state == "pointPlaced"){
        pointPlacedToItinerary(latlng, point);
    } else if(state == "itinerary"){
        // console.log(latlng);
        const millis = Date.now() - startTime;
        if ((millis / 1000) < 0.3){
            itineraryToPointPlaced(latlng,point);
        }
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
    if (zoom > 17){
        itinerary.setStyle({weight : 8*(zoom-16)}); //keep the itinerary always bigger than road 
    } else {
        itinerary.setStyle({weight : 8});
    }
    if (circleZoneOfInterest != null /*&& (state == "pointPlaced" || state == "menu" || state == "slider")*/){
        var zoomMult = Math.floor(2200000/(Math.pow(2,zoom)));
        circleZoneOfInterest.setRadius(zoomMult);
        if ((state == "queryResults" || state == "loadingQuery") && areBracketsOn){
            
            markerBracketOpen.setRadius(zoomMult*0.8);
            markerBracketClose.setRadius(zoomMult*0.8);
            updateSizeMarkers();
        }
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

    if (prevZoom != map.getZoom()){
        needRedraw = true;
    }

    if(markerBracketClose != null && markerBracketOpen != null){
        if (map.hasLayer(markerBracketClose) && state == "pointPlaced"){
            markerBracketOpen.dragging.enable();
            markerBracketClose.dragging.enable();            
        }
    }
}