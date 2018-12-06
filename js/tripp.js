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

    // Load the dummy data to render the list
    self.arrayPlaces = ko.observableArray();
    for (const place of dummyPlaces) {
        self.arrayPlaces.push(new Place(place));
    }

};

ko.applyBindings(new TrippViewModel);