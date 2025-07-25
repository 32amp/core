

const ethers = require("ethers");  

const EVSEdata = {
    hardware_id: "ufo0001",
    evse_model: 1,
    physical_reference: ethers.encodeBytes32String("Под номером 10"),
    directions: [
        {
            language: "ru",
            text: "Возле пожарного выхода",
        }
    ]
}

const EVSEmeta = {
    status_schedule: [
        {
            begin: 123123123, // timestamp
            end:123123123, // timestamp
            status: 6 // maintance
        }
    ],
    capabilities: [1,2,3],
    coordinates: {
        latitude: ethers.parseEther("59.694982"),
        longitude: ethers.parseEther("30.416469")
    },
    parking_restrictions: [0,2,3],
    floor_level:1
}

const image = {
    url: "https://wikimedia.org/",
    ipfs_cid: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
    category: 3,
    _type: 1,
    width: 100,
    height: 100
};
const connector = {
    standard: 1,
    format:2,
    power_type: 1,
    max_voltage: 220,
    max_amperage: 32,
    max_electric_power: 7,
    terms_and_conditions_url: "https://portalenergy.tech"
}

module.exports.EVSEdata = EVSEdata;
module.exports.EVSEmeta = EVSEmeta;
module.exports.image = image;
module.exports.connector = connector;

module.exports.getEvseData = function (){

    return {EVSEdata,EVSEmeta,image,connector}
}