const free_tariff = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 1,
                    price: 0,
                    vat: 0,
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}

const energy_tariff = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 0, // energy
                    price: ethers.parseEther("15.0"), // 15 рублей за кВт·ч
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
    
}

const time_tariff = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 3, // time
                    price: ethers.parseEther("15.0"),
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}


const flat_tariff = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 1, // flat
                    price: ethers.parseEther("500.0"),
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}


const energy_and_parking = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 0, // energy
                    price: ethers.parseEther("16.0"),
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        },
        {
            price_components: [
                {
                    _type: 2, // parking
                    price: ethers.parseEther("20.0"), // per minute, same like time
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}


const energy_and_parking_2 = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 0, // energy
                    price: ethers.parseEther("16.0"),
                    vat: 20
                },
                {
                    _type: 2, // parking
                    price: ethers.parseEther("20.0"), // per minute, same like time
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 0,
                start_time_minute: 0,
                end_time_hour: 0,
                end_time_minute: 0,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}



const energy_with_time_restrictions = {
    tariff_alt_text: [{
        language: "ru",
        text: "Описание тарифа"
    }],
    tariff_alt_url: "",
    elements: [
        {
            price_components: [
                {
                    _type: 0, // energy
                    price: ethers.parseEther("16.0"),
                    vat: 20
                }
            ],
            restrictions: {
                start_time_hour: 19,
                start_time_minute: 0,
                end_time_hour: 23,
                end_time_minute: 30,
                start_date: 0,
                end_date: 0,
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: [1, 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}

module.exports = {free_tariff, energy_tariff, time_tariff, flat_tariff, energy_and_parking, energy_and_parking_2, energy_with_time_restrictions}