const MEDIA_QUERY_WIDTH_MOBILE = 600;

var dummyPlaces = [
    {
        name: `Danny's Burger`,
        category: "Burger",
        /*address  : "Ca. Tello 124",
        phone    : "987-645321",
        schedule : "",*/
        rating: 3,
        image: 'img/dummy-picture1.png'
    },
    {
        name: `Trattoria Lafata`,
        category: "Italian",
        rating: 4,
        image: 'img/dummy-picture2.png'
    },
    {
        name: `Ristorante Lisola`,
        category: "Italian",
        rating: 2.5,
        image: 'img/dummy-picture3.png'
    },
    {
        name: `Chelo's Restaurant`,
        category: "Peruvian",
        rating: 3.5,
        image: 'img/dummy-picture4.png'
    }

];

var Place = function (data) {
    this.placeName = data.name;
    this.placeCategory = data.category;
    this.placeRating = data.rating;
    this.placeImage = data.image;
    // NOTE: More attributes should be added after reading the Google Places API    
};

var TrippViewModel = function () {
    var self = this;

    self.width = ko.observable($('header').width());

    self.arrayPlaces = ko.observableArray();

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
        // TEMPORAL DUMMY DATA: Load the dummy data to render the list
        if ($('#input-search').val() !== "") {

            self.arrayPlaces.removeAll();
            for (const place of dummyPlaces) {
                self.arrayPlaces.push(new Place(place));
            }

            // If the response is OK
            self.isSearchContentValid(true);
            $('#input-search').val("");
            $('#input-search').attr('placeholder', 'Search...');
            self.stylingSearchForm();
        }
        // TEMPORAL DUMMY DATA

    };

    /* This function has as main purpose to modify the styling 
    *  of "Search-Form" when self.isSearchContentValid() is TRUE
    */

    self.stylingSearchForm = function () {
        let $formSearch = $('#form-search'),
            $buttonSearch = $('#button-search'),
            $divSearch = $('#div-search');

        if (self.isSearchContentValid()) {

            $('#form-search').css({
                'flex-direction':'row'
            });

            if (self.width() < MEDIA_QUERY_WIDTH_MOBILE) {

                $formSearch.css({
                    'width' : '90%',
                    'margin-top':'1.2em',
                    'margin-bottom':'1.2em',
                    'min-height': '90px' 
                });

                $divSearch.css({
                    'flex':'1',
                    'padding-right':'1.5em'
                });

                $buttonSearch.css({
                    'flex':'1',
                    'min-width':'90px',
                    'max-width':'90px',
                    'font-size': '0.85em'
                });
            } else {
                $formSearch.css({
                    'width':'85%'
                });

                $divSearch.css({
                    'padding-right':'1.25em'
                });

                $buttonSearch.css({
                    'min-width':'95px',
                    'max-width':'95px',
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
    init: function(element, valueAccesor){
        $(element).rateYo({
            rating: valueAccesor(),
            readOnly: true,
            starWidth : '12px',
            normalFill: '#eae8e3',
            ratedFill: '#673ab7'
        });
    }
};