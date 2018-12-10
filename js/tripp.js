const MEDIA_QUERY_WIDTH_MOBILE = 600;

var Place = function (data) {
    this.placeId = data.placeId;
    this.placeName = data.name;
    this.placeType = data.type;
    this.placeRating = data.rating;
    this.placeImage = ko.observable(data.image);
    this.marker = data.marker;
};

var TrippViewModel = function () {
    var self = this;
    self.width = ko.observable($('header').width());

    self.arrayPlaces = ko.observableArray();
    self.arrayMarkers = [];
    self.selectedPlace = ko.observable();
    self.placesService;

    // When program starts this is false, 
    // only if the response from Google Places API is OK
    // this value is set to TRUE 
    self.isSearchContentValid = ko.observable(false);

    // This function receive the string from #input-search
    // and send to Google Places.
    // With the response data, this function package
    // the info into Places instances which are rendered
    // on the UI
    self.gatherPlacesData = function () {
        let $inputSearch = $('#input-search').val();
        // Define que border of viewport of the map, the query (Ex:Cafeteria)
        let requestPlaces = {
            bounds: styledMap.getBounds(),
            query: $inputSearch
        };

        // TODO: Work on a proper validation function, this is just temporal
        if ($inputSearch !== "") {
            self.placesService = new google.maps.places.PlacesService(styledMap);
            self.placesService.textSearch(requestPlaces, callBackPlaces);
        }
    };

    function callBackPlaces(results, status) {
        switch (status) {
            case google.maps.places.PlacesServiceStatus.OK:

                // Apply the proper styling (valid)
                self.isSearchContentValid(true);
                self.stylingSearchForm();

                // Remove all places from arrayPlaces
                self.arrayPlaces.removeAll();

                // Remove all markers
                self.arrayMarkers.forEach(function (element) {
                    element.setMap(null);
                });

                // Create Places instances with data received and add them to arrayPlaces
                let truncateName = $('header').width() < 600 ? 30 : 22;
                
                for (const [index, result] of results.entries()) {
                    let placeData = {
                        placeId: result.place_id,
                        // if name is longer than truncateName then truncate the name
                        name: result.name.length > truncateName ? result.name.substring(0, truncateName).concat('...') : result.name,
                        // To convert the type to more a human-friendly format
                        type: result.types[0].replace(/_/g, ' '),
                        rating: result.rating,
                        image: result.photos[0].getUrl({maxWidth: 64, maxHeight: 64})
                    }
                    
                    // Add the proper markers on the map per each place
                    let marker = new google.maps.Marker({
                        position: result.geometry.location,
                        map: styledMap,
                        title: result.name,
                        icon: 'img/map-marker.png'
                    });
                    marker.addListener('click', function () {
                        getPlaceFromMarker(this);
                    });

                    // Add the instance of the marker to the respective Place
                    // This will be usefull to play the animation when a place is selected
                    placeData.marker = marker;
                    // Add the marker to the array of Markers, having an array makes easier
                    // to delete the markers when user request a new query search (cafeteria)
                    self.arrayMarkers.push(marker);

                    // Now that placeData is fully set, create an instances and
                    // pass it to arrayPlaces
                    let googlePlace = new Place(placeData);
                    self.arrayPlaces.push(googlePlace);

                    if (index === 0) {
                        // As soon as we load the data, select the first one only
                        self.selectedPlace(googlePlace);
                        self.selectedPlace().marker.setAnimation(google.maps.Animation.BOUNCE); 
                    }
                }

                $('#input-search').val("");
                $('#input-search').attr('placeholder', 'Search...');
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

    // This function search a places from a marker
    // (useful to implement click on marker -> select place)
    function getPlaceFromMarker(marker) {
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
    }

    self.clickSelectPlace = function (place) {
        let oldPlace = self.selectedPlace();

        if (oldPlace !== place) {
            
            // Turn off the marker animation of the oldPlace
            // and Turn on the animation of the marker of the new Place
            oldPlace.marker.setAnimation(-1);
            self.selectedPlace(place);
            self.selectedPlace().marker.setAnimation(google.maps.Animation.BOUNCE);
            // Center the map to the new place (marker clicked)
            styledMap.panTo(place.marker.getPosition());
        }

    };

    /*function toggleBounce(marker) {
        if ((marker.getAnimation() !== null) && (marker.getAnimation() !== undefined)) {
            marker.setAnimation(null);
            marker.setAnimation(undefined);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }*/

    /* This function has as main purpose to modify the styling 
    *  of "Search-Form" when self.isSearchContentValid() is TRUE
    */
    self.stylingSearchForm = function () {
        let $formSearch = $('#form-search'),
            $buttonSearch = $('#button-search'),
            $divSearch = $('#div-search');

        if (self.isSearchContentValid()) {

            $('#form-search').css({
                'flex-direction': 'row'
            });

            if (self.width() < MEDIA_QUERY_WIDTH_MOBILE) {

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
    };
};

$(window).resize(function () {
    TripViewModelInstance.width($('header').width());
    TripViewModelInstance.stylingSearchForm();
});

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