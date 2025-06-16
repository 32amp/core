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
                day_of_week: []
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
                day_of_week: []
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
                day_of_week: []
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
                day_of_week: []
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
                day_of_week: []
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
                day_of_week: []
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
                day_of_week: []
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
                day_of_week: []
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

const energy_with_date_restrictions = {
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
                start_date: Math.floor(Date.parse("2024-02-26T01:00:00Z") / 1000),
                end_date: Math.floor(Date.parse("2024-02-26T23:00:00Z") / 1000),
                min_kwh: 0,
                max_kwh: 0,
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
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

const energy_with_kwh_restrictions = {
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
                    price: ethers.parseEther("25.0"),
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
                min_kwh: ethers.parseEther("0.1"),
                max_kwh: ethers.parseEther("3"),
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                min_kwh: ethers.parseEther("3.1"),
                max_kwh: ethers.parseEther("150"),
                min_current: 0,
                max_current: 0,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
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


const energy_with_current_restrictions = {
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
                    price: ethers.parseEther("25.0"),
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
                min_current: 1,
                max_current: 32,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                min_current: 33,
                max_current: 300,
                min_power: 0,
                max_power: 0,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
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



const energy_with_power_restrictions = {
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
                    price: ethers.parseEther("25.0"),
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
                min_power: 1000, // in watt
                max_power: 7000,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                min_power: 8000,
                max_power: 150000,
                min_duration: 0,
                max_duration: 0,
                day_of_week: []
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


const energy_with_duration_restrictions = {
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
                    price: ethers.parseEther("25.0"),
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
                min_power: 0, // in watt
                max_power: 0,
                min_duration: 1, // seconds
                max_duration: 5*60,
                day_of_week: []
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                min_duration: (5*60)+1,
                max_duration: 120*60,
                day_of_week: []
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


const energy_with_day_of_week_restrictions = {
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
                    price: ethers.parseEther("25.0"),
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
                min_power: 0, // in watt
                max_power: 0,
                min_duration: 0, // seconds
                max_duration: 0,
                day_of_week: [1]
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                day_of_week: [ 2, 3, 4, 5, 6, 7]
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



const energy_with_day_of_week_restrictions_and_min_price = {
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
                    price: ethers.parseEther("25.0"),
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
                min_power: 0, // in watt
                max_power: 0,
                min_duration: 0, // seconds
                max_duration: 0,
                day_of_week: [1]
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                day_of_week: [ 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    min_price: {
        excl_vat: ethers.parseEther("600.0"),
        incl_vat: ethers.parseEther("720.0")
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}




const energy_with_day_of_week_restrictions_and_max_price = {
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
                    price: ethers.parseEther("25.0"),
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
                min_power: 0, // in watt
                max_power: 0,
                min_duration: 0, // seconds
                max_duration: 0,
                day_of_week: [1]
            }
        },
        {
            price_components: [
                {
                    _type: 0, // energy
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
                day_of_week: [ 2, 3, 4, 5, 6, 7]
            }
        }
    ],
    max_price: {
        excl_vat: ethers.parseEther("100.0"),
        incl_vat: ethers.parseEther("120.0")
    },
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0
}


module.exports = {
    free_tariff, 
    energy_tariff, 
    time_tariff, 
    flat_tariff, 
    energy_and_parking, 
    energy_and_parking_2, 
    energy_with_time_restrictions, 
    energy_with_date_restrictions, 
    energy_with_kwh_restrictions,
    energy_with_current_restrictions,
    energy_with_power_restrictions,
    energy_with_duration_restrictions,
    energy_with_day_of_week_restrictions,
    energy_with_day_of_week_restrictions_and_min_price,
    energy_with_day_of_week_restrictions_and_max_price
}