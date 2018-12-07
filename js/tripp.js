var dummyPlaces = [
    {
        name: `Danny's Burger`,
        category: "Burger",
        /*address  : "Ca. Tello 124",
        phone    : "987-645321",
        schedule : "",*/
        rating: 3
    },
    {
        name: `Trattoria Lafata`,
        category: "Italian",
        rating: 4
    },
    {
        name: `Ristorante Lisola`,
        category: "Italian",
        rating: 2.5
    },
    {
        name: `Chelo's Restaurant`,
        category: "Peruvian",
        rating: 3.5
    }

];

var Place = function (data) {
    this.placeName = data.name;
    this.placeCategory = data.category;
    this.placeRating = data.rating;
    // NOTE: More attributes should be added after reading the Google Places API    
};

var TrippViewModel = function () {
    var self = this;

    self.arrayPlaces = ko.observableArray();

    // When program starts this is false, 
    // only if the response from Google Places API is OK
    // this value is set to TRUE 
    self.isSearchContentValid = ko.observable(false);

    // This function receive the string from #search
    // and send to Google Places.
    // With the response data, this function package
    // the info into Places instances which are rendered
    // on the UI
    self.gatherPlacesData = function () {
        // TEMPORAL DUMMY DATA: Load the dummy data to render the list
        if ($('#search').val() !== "")
        {
            self.isSearchContentValid(true);
            
            for (const place of dummyPlaces) {
                self.arrayPlaces.push(new Place(place));
            }
        }
            

        // TEMPORAL DUMMY DATA
    };



};

ko.applyBindings(new TrippViewModel);