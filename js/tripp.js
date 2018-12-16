const MEDIA_QUERY_WIDTH_MOBILE = 600;

var Place = function (data) {
    this.placeId = data.placeId;
    this.placeName = data.name;
    this.placeType = data.type;
    this.placeRating = data.rating;
    this.placeImage = data.image;
    this.marker = data.marker;
};

var TrippViewModel = function () {
    var self = this;

    self.width = $('header').width();
    self.arrayPlaces = ko.observableArray();
    self.selectedPlace = ko.observable();
    self.arrayMarkers = [];
    self.infoWindow = new google.maps.InfoWindow();
    self.exploredPlacesMap = new Map();

    // When response from Google Places API is OK, value is TRUE 
    self.isSearchContentValid = ko.observable(false);

    self.gatherPlacesData = function () {

        //============  CODIGO ORIGINAL - NO BORRAR ===============
         let $inputSearch = $('#input-search').val();
         // Define que border of viewport of the map, to make the query (Ex:Cafeteria)
         let requestPlaces = {
             bounds: styledMap.getBounds(),
             query: $inputSearch
         };
         // TODO: Work on a proper validation function, this is just temporal
         if ($inputSearch !== "") {
             let placesService = new google.maps.places.PlacesService(styledMap);
             placesService.textSearch(requestPlaces, callBackPlaces);
         }
        //============  CODIGO ORIGINAL - NO BORRAR ===============

        //============  DUMMY DATA INFO WINDOW - DELETE LATER ===============
        /*let dummyObj = {
            place_id: "SDASDASDQ",
            name: "Chelo's",
            rating: 2.0,
            type: "restaurant",
            formatted_address: "ijasd 1231oijasdasdasd asdasdsdasd asdas 332",
            opening_hours: ["sdkjhaksd", "oifo4", "asdhai3", "sdkjhaksd", "oifo4", "asdhai3", "oajsdoasdasdasd"],
            formatted_phone_number: "(055)384593",
            review: [],
            website: "www.google.com",
            photos: "img/dummy-picture1.png"
        };

        var dummyMarker = new google.maps.Marker({
            position: styledMap.getCenter(),
            map: styledMap,
            title: 'Hello World!'
        });

        renderInfoWindow(dummyObj, dummyMarker);*/
        //============  DUMMY DATA INFO WINDOW - DELETE LATER ===============
    };

    // This function makes a place "selected", this is used for when user click a place
    // from column or map marker
    self.clickSelectPlace = function (place) {
        let oldPlace = self.selectedPlace();

        if (oldPlace !== place) {
            if (oldPlace !== undefined)
                oldPlace.marker.setAnimation(-1);
            self.selectedPlace(place);
            self.selectedPlace().marker.setAnimation(google.maps.Animation.BOUNCE);
            // Center the map to the new place (marker clicked)
            styledMap.panTo(place.marker.getPosition());
            // Load the detail data & render a proper infoWindow
            self.loadPlaceDetailData(place);
        }

    };

    // This procedure search and select the proper place from
    // the places list when a map marker is clicked
    self.getPlaceFromMarker = function (marker) {
        for (const place of self.arrayPlaces()) {
            if (place.marker === marker) {
                if (self.selectedPlace() !== place) {
                    $('.places-content').scrollTop($(".selectedItem").position().top);
                    self.clickSelectPlace(place);
                    $('.places-content').animate({
                        scrollTop: $(".selectedItem").position().top
                    }, 350);
                }
            }
        }
    };

    self.loadPlaceDetailData = function (place) {
        // If the selected place hasn't been selected before, then load data from Place Detail
        // (This help us to reduce unnecessary requests to Google Places API)
        if (!self.exploredPlacesMap.has(place.placeId)) {

            // Get Place Detail info from Google Places API
            let placeDetailRequest = {
                placeId: place.placeId,
                fields: ['name',
                    'rating',
                    'type',
                    'formatted_address',
                    'formatted_phone_number',
                    'website',
                    'photos'
                ]
            };
            let placeDetailService = new google.maps.places.PlacesService(styledMap);
            placeDetailService.getDetails(placeDetailRequest, callBackPlaceDetail);
        } else {
            // Send the object data saved on the MAP to be rendered
            renderInfoWindow(self.exploredPlacesMap.get(place.placeId), place.marker);
        }
    }
};

//=============================== KNOCKOUT  ========================

var TripViewModelInstance = new TrippViewModel;
ko.applyBindings(TripViewModelInstance);

ko.bindingHandlers.starRating = {
    init: function (element, valueAccesor) {
        $(element).rateYo({
            rating: valueAccesor(),
            readOnly: true,
            starWidth: '12px',
            normalFill: '#c8c8c8ff',
            ratedFill: '#673ab7'
        });
    }
};

//=============================== HELPER FUNCTIONS & PROCEDURES ========================

$(window).resize(function () {
    TripViewModelInstance.width = $('header').width();
    stylingSearchForm();
});

// This function has as main purpose to modify the styling 
//   of "Search-Form" when isSearchContentValid() is TRUE
var stylingSearchForm = function () {
    let $formSearch = $('#form-search'),
        $buttonSearch = $('#button-search'),
        $divSearch = $('#div-search');

    if (TripViewModelInstance.isSearchContentValid()) {
        $('#form-search').css({
            'flex-direction': 'row'
        });

        if (TripViewModelInstance.width < MEDIA_QUERY_WIDTH_MOBILE) {
            $formSearch.css({
                'width': '90%',
                'margin-top': '1.2em',
                'margin-bottom': '1.2em',
                'min-height': '90px'
            });

            $divSearch.css({
                'flex': '1',
                'padding-right': '1.5em'
            });

            $buttonSearch.css({
                'flex': '1',
                'min-width': '90px',
                'max-width': '90px',
                'font-size': '0.85em'
            });
        } else {
            $formSearch.css({
                'width': '85%'
            });

            $divSearch.css({
                'padding-right': '1.25em'
            });

            $buttonSearch.css({
                'min-width': '95px',
                'max-width': '95px',
                'font-size': '0.9em'
            });
        }
    }
}

function renderInfoWindow(objectData, mapMarker) {

    TripViewModelInstance.infoWindow.setContent("");
    TripViewModelInstance.infoWindow.close();

    // Destructuring of objectData 
    let {name,
        rating,
        formatted_address,
        formatted_phone_number,
        website,
        photos } = objectData;

    // If place doesn't have a website, the DOM should be diferent (only Add To Favorite)
    let infoWindowsButton;
    if (website !== undefined) {
        infoWindowsButton =
            `
        <div class="info-window-button-website">
            <button onclick="window.open('${website}', '_blank');" class="info-window-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">
            Website
            </button>
        </div>
        <div class="info-window-button-favorite">
            <button class="info-window-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
            Favorite
            </button>
        </div>
        `;
    } else {
        infoWindowsButton =
            `
        <div class="info-window-button-favorite">
            <button class="info-window-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
            Favorite
            </button>
        </div>
        `;
    }

    // Render the proper DOM if exist or not reviews
   /* let infoWindowReviews;
    if (review.length > 0)
    {
        infoWindowReviews = `<p class="info-window-label">Reviews:</p>`;
        for (const text of review) {
            infoWindowReviews += ``;
        }
    } else {

    }*/

    // This code allow to render the stars rating within the infoWindow
    let infoWindowRating = $('<div></div>').wrap('<p></p>').rateYo({
        rating: rating,
        readOnly: true,
        starWidth: '20px',
        normalFill: '#c8c8c8ff',
        ratedFill: '#673ab7'
    }).parent().html();

    // if place does/doesn't have phone, render the proper DOM
    let infoWindowPhone;
    if(formatted_phone_number !== undefined)
    {
        infoWindowPhone = `${formatted_phone_number}`;
    } else {
        infoWindowPhone = `-`;
    }

    // The content to be render into the infoWindow
    let infoWindowContent =
        `<div class="info-window-content">

        <div class="info-window-data-content">
            <div class="info-window-data-name">${name}</div>
            <div class="info-window-data-rating">${infoWindowRating}</div>
            <div class="info-window-middle">
                <div class="info-window-image-content">
                    <img src="${photos[0].getUrl()}" alt="">
                </div>
                <div>
                    <div class="info-window-data-address">
                        <p class="info-window-label">Address:</p>
                        <p class="info-window-data">${formatted_address}</p>
                    </div>
                    <div class="info-window-data-phone">
                        <p class="info-window-label">Phone:</p>
                        <p class="info-window-data">${infoWindowPhone}</p>
                    </div>
                </div>
            </div>            
        </div>
        
        <div class="info-window-review-content">
            
        </div>

        <div class = "info-window-buttons-content">
        ${infoWindowsButton}
        </div>
    </div>
    `;

    TripViewModelInstance.infoWindow.setContent(infoWindowContent);
    TripViewModelInstance.infoWindow.open(styledMap, mapMarker);


}

//=============================== CALLBACK FUNCTIONS ========================

// Callback function to execute when "placesService.textSearch" (Google Places API) is called
function callBackPlaces(results, status) {
    switch (status) {
        case google.maps.places.PlacesServiceStatus.OK:
            {
                $('#input-search').val("");
                $('#input-search').attr('placeholder', 'Search...');

                // Apply the proper styling (valid)
                TripViewModelInstance.isSearchContentValid(true);
                stylingSearchForm();

                // Remove all places from arrayPlaces
                TripViewModelInstance.arrayPlaces.removeAll();

                // Remove all markers
                TripViewModelInstance.arrayMarkers.forEach(function (element) {
                    element.setMap(null);
                });

                let maxCharactersName = TripViewModelInstance.width < 600 ? 30 : 22;

                // With the result data, we instanciate a Place and push it into arrayPlaces
                for (const [index, result] of results.entries()) {
                    let placeData = {
                        placeId: result.place_id,
                        // if name is longer than maxCharactersName then truncate the name
                        name: result.name.length > maxCharactersName ? result.name.substring(0, maxCharactersName).concat('...') : result.name,
                        // To convert the type to more a human-friendly format
                        type: result.types[0].replace(/_/g, ' '),
                        rating: result.rating,
                        image: result.photos[0].getUrl({ maxWidth: 64, maxHeight: 64 })
                    }

                    // Add the proper markers on the map per each place
                    let marker = new google.maps.Marker({
                        position: result.geometry.location,
                        map: styledMap,
                        title: result.name,
                        icon: 'img/map-marker.png'
                    });
                    marker.addListener('click', function () {
                        // When a marker is clicked, the proper Place is selected on the Places List
                        TripViewModelInstance.getPlaceFromMarker(this);
                        // This show the infoWindow even when the user have closed previously
                        TripViewModelInstance.infoWindow.open(styledMap, this);
                    });

                    // Add the instance of the marker to the respective Place
                    // This will be useful to play the animation when a place is selected
                    placeData.marker = marker;
                    // Add the marker to the array of Markers, having an array makes easier
                    // to delete the markers when user request a new query search
                    TripViewModelInstance.arrayMarkers.push(marker);

                    // With the received data properly formatted, instanciate a Place
                    let googlePlace = new Place(placeData);
                    TripViewModelInstance.arrayPlaces.push(googlePlace);

                    // By default when the data is received, the first element is selected
                    if (index === 0) {
                        // As soon as we load the data, select the first one only
                        TripViewModelInstance.clickSelectPlace(googlePlace);
                    }
                }
            }
            break;
        case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
            alert('ZERO_RESULTS');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...');
            break;
        case google.maps.places.PlacesServiceStatus.ERROR:
            alert('ERROR');
            break;
        case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
            alert('INVALID_REQUEST');
            break;
        case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
            alert('OVER_QUERY_LIMIT');
            break;
        case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
            alert('REQUEST_DENIED');
            break;
        case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
            alert('UNKNOWN_ERROR');
            break;
    }
}


// Callback function to be executed when "Place Detail" service is requested from Google Places API
function callBackPlaceDetail(result, status) {

    switch (status) {
        case google.maps.places.PlacesServiceStatus.OK:

            TripViewModelInstance.exploredPlacesMap.set(result.place_id, result);
            renderInfoWindow(result, TripViewModelInstance.selectedPlace().marker);

            break;
        case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
            alert('ZERO_RESULTS');
            break;
        case google.maps.places.PlacesServiceStatus.ERROR:
            alert('ERROR');
            break;
        case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
            alert('INVALID_REQUEST');
            break;
        case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
            alert('OVER_QUERY_LIMIT');
            break;
        case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
            alert('REQUEST_DENIED');
            break;
        case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
            alert('UNKNOWN_ERROR');
            break;
    }
}
