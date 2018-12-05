var map;
function initMap() {
   map = new google.maps.Map(document.getElementsByClassName('map-content')[0], {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8
    });
}

initMap();