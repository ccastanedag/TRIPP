var map;
var geocoder;

function codeAddress() {
    let address = "lima,peru";
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
        map.setCenter(results[0].geometry.location);
        /*var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });*/
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementsByClassName('map-content')[0], {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
        disableDefaultUI: true
    });

    // Center map to address (city, COUNTRY) 
    codeAddress();
}

initMap();