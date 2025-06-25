const ethers = require("ethers");  

const location = {
    name: "New location",
    _address: "Dom kolotuskina",
    city:  ethers.encodeBytes32String("Moskow"),
    postal_code: ethers.encodeBytes32String("103892"),
    state: ethers.encodeBytes32String("Moskow"),
    country: ethers.encodeBytes32String("RUS"),
    coordinates: {
        latitude: "59.694982",
        longitude: "30.416469"
    },
    parking_type: 5,
    facilities: [1,2], // Hotel, Restaurant
    time_zone : "Moskow/Europe",
    charging_when_closed: true,
    publish: true
};

const image = {
    url: "https://upload.wikimedia.org/wikipedia/ru/thumb/e/e8/BORAT%21.jpg/201px-BORAT%21.jpg",
    ipfs_cid: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
    category: 3,
    _type: 1,
    width: 100,
    height: 100
};

const relatedLocation = {
    latitude: ethers.parseEther("59.694982"),
    longitude: ethers.parseEther("30.416469"),
    name: [{
        language: "ru",
        text: "Кафе"
    }]
};

const openingTimes = {
    twentyfourseven: true,
    regular_hours:[
        {
            week_day:1,
            period_begin:"7:00",
            period_end:"21:00"
        }
    ],
    exceptional_openings:[
        {
            begin:7,
            end:21
        }
    ],
    exceptional_closings:[
        {
            begin:7,
            end:21
        }
    ],
}

const direction = {
    language: "ru",
    text: "Заезд с улицы колотушкина, возле волшебного дуба"        
}

module.exports = {location, image, relatedLocation, openingTimes, direction}