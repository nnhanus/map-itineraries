async function testORS(){
    let request = new XMLHttpRequest();

    // request.open('POST', "https://api.openrouteservice.org/v2/isochrones/driving-car");

    request.open('POST', "https://mapitin.lisn.upsaclay.fr:8890/ors/v2/isochrones/driving-car");

    request.responseType = "json";

    request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', '5b3ce3597851110001cf62488744889721734d3298f65573faadbc4f');//API key

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            console.log('Status:', this.status);
            console.log('Headers:', this.getAllResponseHeaders());
            console.log("Response body:");
            console.log('Body:', this.response);
        }
    };

    // const body = '{"locations":[[1.06571,48.23889],[0.87957,48.20013],[0.70104,48.15214],[0.52317,48.09511],[0.3454,48.05335]],"profile":"driving-car","range":[20000],"range_type":"distance"}';
    const body = '{"locations":[[1.06571,48.23889],[0.87957,48.20013]],"profile":"driving-car","range":[20000],"range_type":"distance"}';
    console.log("sending request");
    request.send(body);
}
