const MEDIA_QUERY_WIDTH_MOBILE = 600;

var Place = function (data) {
    this.placeId = data.placeId;
    this.placeName = data.name;
    this.placeType = data.type;
    this.placeRating = data.rating;
    this.placeImage = data.image;
    this.marker = data.marker;

    this.lat = data.lat; // This data is set when crete the Render Structure from localStorage, not from Places API
    this.lng = data.lng; // This data is set when crete the Render Structure from localStorage, not from Places API

    this.addDetailData = function (result) {
        this.formattedAddress = result.formatted_address;
        this.formattedPhoneNumber = result.formatted_phone_number;
        this.website = result.website;
    };

    this.returnAsObject = function () {
        let obj = {
            placeId: this.placeId,
            name: this.placeName,
            type: this.placeType,
            rating: this.placeRating,
            image: this.placeImage,
            formatted_address: this.formattedAddress,
            formatted_phone_number: this.formattedPhoneNumber,
            website: this.website,
            lat: this.marker.position.lat(),
            lng: this.marker.position.lng()
        };
        return obj;
    };
};

var FavoritePlace = function (data) {
    this.destination = data.destination;
    this.places = ko.observableArray(data.places);// This will be an array of Places instances
    this.flagUrl = data.flagUrl;
}

var TrippViewModel = function () {
    var self = this;

    self.width = $('header').width();
    self.arrayPlaces = ko.observableArray();
    self.selectedPlace = ko.observable();
    self.lastSelectedPlace; // store the selected place from Map page at the moment the user click on Favorites button
    self.selectedFavoritePlace = ko.observable(); //WATCH OUT!: This represent a place from the favorite page, this is not a whole FavoritePlace instance
    self.arrayMarkers = [];
    self.arrayFavoriteMarkers = [];
    self.infoWindow = new google.maps.InfoWindow();
    self.exploredPlacesMap = new Map();
    self.currentPage = ko.observable('Home');
    self.city = ko.observable();
    self.country = ko.observable();
    self.countryCode = ko.observable();
    self.flagUrl = ko.observable();
    self.showFavoritesButton = ko.observable(false);
    self.destination = ko.pureComputed(function () {
        return `${self.city()}, ${self.country()} - ${self.countryCode()}`;
    });
    self.shortDestination = ko.pureComputed(function () {
        return `${self.city()}, ${self.country()}`;
    });
    self.setFavoritesPlaces = ko.observableArray(); // Gives the structure to render the data of Favorites
    self.latlng; // store the center of the map or the lasSelectedPlace position. When user click Favorites button

    // When response from Google Places API is OK, value is TRUE 
    self.isSearchContentValid = ko.observable(false);

    self.changePageTo = function (page) {
        if (page === "Home") { // (Want to go to HOME)
            window.location.reload();
        }
        else {
            if (page === "Favorites") { // (Want to go to FAVORITES)
                if (self.currentPage() !== "Favorites") {
                    self.currentPage(page);


                    if (self.isSearchContentValid() === true) {
                        // Hide/Erase visually previous markers from Map Page if isSearchIsValid () TRUE
                        self.arrayMarkers.forEach(function (element) {
                            element.setMap(null);
                        });
                        self.lastSelectedPlace = self.selectedPlace();
                    }

                    // Create the render logic structure
                    self.createRenderStructure();

                    // Select the first Place in FavoritePlace
                    self.clickSelectFavoritePlace(self.setFavoritesPlaces()[0], self.setFavoritesPlaces()[0].places()[0]);
                }
            } else // (Want to go to MAP)
            {
                if (self.currentPage() === "Favorites") { // (if previous was FAVORITES)
                    // Hide/Erase visually previous markers from Favorite Page

                    self.arrayFavoriteMarkers.forEach(function (element) {
                        element.setMap(null);
                    });

                    // Load the arrayMarkers (map markers) into the map
                    self.arrayMarkers.forEach(function (element) {
                        element.setMap(styledMap);
                    });

                    self.currentPage(page);

                    // Logic to reposition the MAP center on Map page
                    if (self.isSearchContentValid() === true) // is a valid search was made
                    {
                        self.selectedPlace(undefined);
                        self.clickSelectPlace(self.lastSelectedPlace);
                        styledMap.setZoom(15);

                    } else { // if city was defined but no search (eg: hotel) was made
                        if (self.city() !== undefined) {
                            styledMap.setCenter(self.latlng);
                            styledMap.setZoom(15);
                        }
                    }

                } else { // (if previous was HOME)
                    self.currentPage(page);
                }

            }
        }

    };

    // Center the Map to City, Country
    self.codeAddress = function () {

        self.city(toProperCase($('#city').val()));
        self.country($('#country').val().toUpperCase());

        if ((self.city() !== '') && (self.country() !== '')) {
            let regex = /^[a-zA-Z\s]*$/;
            if ((regex.test(self.city()) === true) && (regex.test(self.country()) === true)) {
                geocoder.geocode({ 'address': self.shortDestination() }, function (results, status) {
                    if (status == 'OK') {
                        styledMap.setCenter(results[0].geometry.location);
                        self.latlng = styledMap.getCenter();

                        // To get the country code to render the proper flag
                        for (let i = 0; i < results[0].address_components.length; i++) {
                            let addressType = results[0].address_components[i].types[0];

                            if (addressType === "country") {
                                let countryCode = results[0].address_components[i].short_name;
                                self.countryCode(countryCode);
                                let stringUrl = `https://www.countryflags.io/${countryCode}/flat/24.png`;
                                self.flagUrl(stringUrl);
                            }
                        }
                        self.changePageTo('Map');
                    } else {
                        // Oops! City, COUNTRY wasn't found
                        alert(`Oops! ${self.city()}, ${self.country()} wasn't found on Google Maps`);
                    }
                });
            } else {
                // Enter a valid City/Country
                alert('Oops! enter a valid City/Country');
            }

        } else {
            // Enter a valid city/country
            alert('Oops! enter a valid City/Country');
        }
    }

    self.gatherPlacesData = function () {

        let $inputSearch = $('#input-search').val();
        $('#input-search').blur(); 
        // Define que border of viewport of the map, to make the query (Ex:Cafeteria)
        let requestPlaces = {
            bounds: styledMap.getBounds(),
            query: $inputSearch
        };
        // TODO: Work on a proper validation function, this is just temporal
        if ($inputSearch !== "") {
            let regex = /^[a-zA-Z\s]*$/;
            if(regex.test($inputSearch) === true)
            {
                let placesService = new google.maps.places.PlacesService(styledMap);
                placesService.textSearch(requestPlaces, callBackPlaces);
            }else {
                alert('Oops! enter a valid search term. (Eg: Hotel)');
            }
            
        } else {
            alert("Oops! enter a valid search term. (Eg: Hotel)");
        }

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

    // This function select a Place in the Favorite List (pink) and render all markers from FavoritePlace.places
    // And also render the infoWindow with the data of the selected place
    self.clickSelectFavoritePlace = function (favoritePlace, place) {
        let oldFavoritePlace = self.selectedFavoritePlace();

        if (oldFavoritePlace !== place) {
            if (oldFavoritePlace !== undefined)
                oldFavoritePlace.marker.setAnimation(-1);

            self.selectedFavoritePlace(place);
            self.selectedFavoritePlace().marker.setAnimation(google.maps.Animation.BOUNCE);
            // Center the map to selectedFavoritePlace and zoom
            styledMap.panTo(self.selectedFavoritePlace().marker.getPosition());
            if (styledMap.zoom !== 15) {
                styledMap.setZoom(15);
            }
            // Render a proper infoWindow
            renderInfoWindow(place);
        }
    }

    // This procedure search and select the proper place from
    // the places list when a map marker is clicked
    self.getPlaceFromMarker = function (marker) {
        for (const place of self.arrayPlaces()) {
            if (place.marker === marker) {
                if (self.selectedPlace() !== place) {

                    self.clickSelectPlace(place);

                    let target = document.getElementsByClassName('selectedItem')[0];
                    let container = document.getElementsByClassName('places-content')[0];

                    // Scroll-Y the (.places-content) to the selected item
                    scrollIfNeeded(target, container);
                }
            }
        }
    };

    // This procedure search and select the proper place from
    // the FavoritePlace list when a map marker is clicked
    self.getFavoritePlaceFromMarker = function (marker) {
        for (const favoritePlace of self.setFavoritesPlaces()) {
            for (const place of favoritePlace.places()) {
                if (place.marker === marker) {

                    self.clickSelectFavoritePlace(favoritePlace, place);

                    let target = document.getElementsByClassName('selectedItem')[0];
                    let container = document.getElementsByClassName('places-content')[1];

                    // Scroll-Y the Favorite List (.places-content) to the selected item
                    scrollIfNeeded(target, container);
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
                    'website'
                ]
            };
            let placeDetailService = new google.maps.places.PlacesService(styledMap);
            placeDetailService.getDetails(placeDetailRequest, callBackPlaceDetail);
        } else {
            // Send the object data saved on the MAP to be rendered
            renderInfoWindow(self.exploredPlacesMap.get(place.placeId));
        }
    }

    self.addToFavorites = function () {

        let selfDestination = self.destination();
        let selfSelectedPlace = self.selectedPlace();
        let destinationData = localStorage.getItem(selfDestination);
        let dummyPlaces = [];

        // Save to Favorite Succes Snackbar
        let notification = document.querySelector('.mdl-js-snackbar');
        let data = {
            message: 'The place has successfully added to Favorites',
            timeout: 4000
        };

        // To update the render state of the Favorites Button
        if (self.showFavoritesButton() === false) {
            self.showFavoritesButton(true);
        }

        // If localStorage is empty
        if (localStorage.length === 0) {
            dummyPlaces.push(selfSelectedPlace.returnAsObject());
            localStorage.setItem(selfDestination, JSON.stringify(dummyPlaces));
            notification.MaterialSnackbar.showSnackbar(data);
        } else {
            // If destination (Eg: Lima, Perú) exist already as key within localStorage
            if (destinationData !== null) {
                let placesData = JSON.parse(destinationData);
                // If place exist within localStorage - Show Snackbar
                if (isElementInSetByAttribute(selfSelectedPlace.returnAsObject(), placesData, "placeId")) {
                    let notification = document.querySelector('.mdl-js-snackbar');
                    let data = {
                        message: 'This place is already in your Favorites',
                        timeout: 4000
                    };
                    notification.MaterialSnackbar.showSnackbar(data);

                } else {
                    placesData.push(selfSelectedPlace.returnAsObject());
                    localStorage.setItem(selfDestination, JSON.stringify(placesData));
                    notification.MaterialSnackbar.showSnackbar(data);
                }
            } else {
                dummyPlaces.push(selfSelectedPlace.returnAsObject());
                localStorage.setItem(selfDestination, JSON.stringify(dummyPlaces));
                notification.MaterialSnackbar.showSnackbar(data);
            }
        }
    }

    // Render Favorites Button if localStorage have values
    self.renderFavoritesButton = function () {
        if (localStorage.length !== 0) {
            self.showFavoritesButton(true);
        }
    };

    self.createRenderStructure = function () {

        // Empty the Render Structure inside setFavoritePlaces
        self.setFavoritesPlaces.removeAll();
        // Empty the arrayFavoritesMarkers to avoid duplicates
        emptyArray(self.arrayFavoriteMarkers);

        for (let index = 0; index < localStorage.length; index++) {

            let tempPlaces = [], dummyPlaces = [];
            let dummyDestination = localStorage.key(index);
            let tempCountryCode = dummyDestination.substring(dummyDestination.indexOf('-') + 2);
            let shortDestination = dummyDestination.substring(0, dummyDestination.indexOf('-') - 1);
            let dummyFlagUrl = `https://www.countryflags.io/${tempCountryCode}/flat/24.png`;

            tempPlaces = JSON.parse(localStorage.getItem(localStorage.key(index)));

            for (let index2 = 0; index2 < tempPlaces.length; index2++) {

                let dummyPlace = new Place(tempPlaces[index2]);

                dummyPlace.addDetailData(tempPlaces[index2]); // We have to add detail data because the constructor doesnt send this info to the instance

                let marker = new google.maps.Marker({
                    position: { lat: dummyPlace.lat, lng: dummyPlace.lng },
                    title: dummyPlace.placeName,
                    map: styledMap,
                    icon: 'img/map-marker.png'
                });

                // Add Click Event Listener, so when user click a marker the infoWindow Appear and select the proper Place from Favorite List
                marker.addListener('click', function () {
                    // When a marker is clicked, the proper Place is selected on the Favorite List

                    self.getFavoritePlaceFromMarker(this);

                    // This show the infoWindow even when the user have closed previously
                    self.infoWindow.open(styledMap, this);
                });

                // Add the new created marker to arrayFavoriteMarker
                self.arrayFavoriteMarkers.push(marker);

                dummyPlace.marker = marker;

                dummyPlaces.push(dummyPlace);
            }
            let objFavoritePlace = {
                destination: shortDestination,
                places: dummyPlaces,
                flagUrl: dummyFlagUrl
            }
            let dummyFavoritePlace = new FavoritePlace(objFavoritePlace);
            self.setFavoritesPlaces.push(dummyFavoritePlace);
        }
    };

    self.deleteFavoritePlace = function (favoritePlace) {
        // Delete Favorite Place from localStorage
        let countryCode = favoritePlace.flagUrl.substring(favoritePlace.flagUrl.indexOf('.io/')+4,favoritePlace.flagUrl.indexOf('.io/')+6);
        let destination = favoritePlace.destination;
        destination += ` - ${countryCode}`;

        localStorage.removeItem(destination)

        // To update the render state of the Favorite Button
        if (localStorage.length === 0) {
            self.showFavoritesButton(false);
        }

        // Delete the all markers
        for (const iterator of favoritePlace.places()) {
            iterator.marker.setMap(null); // Hide the marker visually from the map
            // Delete the marker from arrayFavoriteMarkers
            for (let index = 0; index < self.arrayFavoriteMarkers.length; index++) {
                if (self.arrayFavoriteMarkers[index] === iterator.marker) {
                    self.arrayFavoriteMarkers.splice(index, 1);
                    break;
                }
            }
        }

        // Delete Favorite Place from render structure
        self.setFavoritesPlaces.remove(favoritePlace);

        // Select the first place of the new first FavoritePlace
        if (self.setFavoritesPlaces().length !== 0) {
            self.clickSelectFavoritePlace(self.setFavoritesPlaces()[0], self.setFavoritesPlaces()[0].places()[0]);
        } else {


            if (self.city() !== undefined) {
                $(".back-to-city").click();
            } else {
                $(".back-to-home").click();
            }


        }
    };

    self.deletePlace = function (favoritePlace, place) {
        //Delete Place from localStorage
        let countryCode = favoritePlace.flagUrl.substring(favoritePlace.flagUrl.indexOf('.io/')+4,favoritePlace.flagUrl.indexOf('.io/')+6);
        let destination = favoritePlace.destination;
        destination += ` - ${countryCode}`;
        let places = JSON.parse(localStorage.getItem(destination));
        for (let index = 0; index < places.length; index++) {
            if (places[index].placeId === place.placeId) {
                places.splice(index, 1);
            }
        }

        localStorage.setItem(destination, JSON.stringify(places));

        // Delete the marker from map
        for (let index = 0; index < self.arrayFavoriteMarkers.length; index++) {
            if (self.arrayFavoriteMarkers[index] === place.marker) {
                self.arrayFavoriteMarkers.splice(index, 1);
                break;
            }
        }
        place.marker.setMap(null); // Erase/Hide the marker visually from the map

        // Delete Place from render structure (Knockout will handle this)
        favoritePlace.places.remove(place);

        if (place === self.selectedFavoritePlace()) {
            self.clickSelectFavoritePlace(favoritePlace, favoritePlace.places()[0]);
        }

    };

    self.renderFavoritesButton();
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

// Convert string to Title Case
var toProperCase = function (text) {
    return text.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};

// Add To Favorites (works as bridge function between infoWindow DOM and ViewModel)
var addToFavorites = function () {
    TripViewModelInstance.addToFavorites();
};

// Change page from the Navbar
var changePageTo = function(page){
    TripViewModelInstance.changePageTo(page);
}

// Search an element inside iterable using attribute as criteria
var isElementInSetByAttribute = function (element, set, attribute) {
    for (const iterator of set) {
        if (element[attribute] === iterator[attribute])
            return true;
    }
    return false;
};

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

function renderInfoWindow(instancePlace) {

    TripViewModelInstance.infoWindow.setContent("");
    TripViewModelInstance.infoWindow.close();

    // Destructuring of objectData 
    let { placeName,
        placeRating,
        formattedAddress,
        formattedPhoneNumber,
        website,
        placeImage } = instancePlace;

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
            <button onclick="addToFavorites()" class="info-window-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
            Favorite
            </button>
        </div>
        `;
    } else {
        infoWindowsButton =
            `
        <div class="info-window-button-favorite">
            <button onclick="addToFavorites()" class="info-window-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
            Favorite
            </button>
        </div>
        `;
    }

    // This code allow to render the stars rating within the infoWindow
    let infoWindowRating = $('<div></div>').wrap('<p></p>').rateYo({
        rating: placeRating,
        readOnly: true,
        starWidth: '20px',
        normalFill: '#c8c8c8ff',
        ratedFill: '#673ab7'
    }).parent().html();

    // if place does/doesn't have phone, render the proper DOM
    let infoWindowPhone;
    if (formattedPhoneNumber !== undefined) {
        infoWindowPhone = `${formattedPhoneNumber}`;
    } else {
        infoWindowPhone = `-`;
    }

    // The content to be render into the infoWindow
    let infoWindowContent =
        `<div class="info-window-content">

        <div class="info-window-data-content">
            <div class="info-window-data-name">${placeName}</div>
            <div class="info-window-data-rating">${infoWindowRating}</div>
            <div class="info-window-middle">
                <div class="info-window-image-content">
                    <img src="${placeImage}" alt="">
                </div>
                <div>
                    <div class="info-window-data-address">
                        <p class="info-window-label">Address:</p>
                        <p class="info-window-data">${formattedAddress}</p>
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
    TripViewModelInstance.infoWindow.open(styledMap, instancePlace.marker);


}

function scrollIfNeeded(element, container) {

    if (element.offsetTop < container.scrollTop) {
        animateScroll(container.scrollTop, element.offsetTop, container);
    } else {
        const offsetBottom = element.offsetTop + element.offsetHeight;
        const scrollBottom = container.scrollTop + container.offsetHeight;
        if (offsetBottom > scrollBottom) {
            animateScroll(container.scrollTop, offsetBottom - container.offsetHeight, container);
        }
    }
}

function animateScroll(startValue, endValue, container) {
    $({ n: startValue }).animate({ n: endValue }, {
        duration: 350,
        step: function (now, fx) {
            container.scrollTop = now;
        }
    });
}

function emptyArray(arr) {
    while (arr.length !== 0) {
        arr.pop();
    }
}
//=============================== CALLBACK FUNCTIONS ========================

// Callback function to execute when "placesService.textSearch" (Google Places API) is called
function callBackPlaces(results, status) {
    switch (status) {
        case google.maps.places.PlacesServiceStatus.OK:
            {
                $('#input-search').val("");
                $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');

                // Apply the proper styling (valid)
                TripViewModelInstance.isSearchContentValid(true);
                stylingSearchForm();

                // Remove all places from arrayPlaces
                TripViewModelInstance.arrayPlaces.removeAll();

                // Remove all markers
                TripViewModelInstance.arrayMarkers.forEach(function (element) {
                    element.setMap(null);
                });
                emptyArray(TripViewModelInstance.arrayMarkers);

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
            alert('Oops! no results were found');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');
            break;
        case google.maps.places.PlacesServiceStatus.ERROR:
            alert('Oops! and error ocurred with Google Maps. Try again!');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');
            break;
        case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
            alert('Oops! the request term is invalid');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');
            break;
        case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
            alert('Oops! The number of Google Maps requests has reach its limit. Try later');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');
            break;
        case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
            alert('Oops! That request was denied by Google Maps');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');
            break;
        case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
            alert('Oops! An unknown error has occurred with Google Maps, Try again!');
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...(Eg. Hotel)');
            break;
    }
}


// Callback function to be executed when "Place Detail" service is requested from Google Places API
function callBackPlaceDetail(result, status) {

    switch (status) {
        case google.maps.places.PlacesServiceStatus.OK:
            // Fill the details data obtained for the selectedPlace
            TripViewModelInstance.selectedPlace().addDetailData(result);
            TripViewModelInstance.exploredPlacesMap.set(result.place_id, TripViewModelInstance.selectedPlace());
            renderInfoWindow(TripViewModelInstance.selectedPlace());

            break;
        case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
            alert('Oops! no results were found');
            break;
        case google.maps.places.PlacesServiceStatus.ERROR:
            alert('Oops! an error have ocurred with Google Maps');
            break;
        case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
            alert('Oops! the info request was invalid');
            break;
        case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
            alert('Oops! The number of Google Maps requests has reach its limit. Try later');
            break;
        case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
            alert('Oops! That request was denied by Google Maps');
            break;
        case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
            alert('Oops! An unknown error has occurred with Google Maps, Try again!');
            break;
    }
}
