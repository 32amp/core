const free_tariff = {
    tariff: {
        currency: 1,
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
                        step_size: 0
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
        ]
    },
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0,
    energy_mix: {
        is_green_energy: true,
        energy_sources: [{
            source: 1,
            percentage: 10,
        }],
        environ_impact: [{
            category: 1,
            amount: 10
        }],
        supplier_name: "test",
        energy_product_name: "test"
    }
}

const energy_tariff = {
    tariff: {
        currency: 1,
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
                        vat: 20,
                        step_size: ethers.parseEther("1.0") // 1 кВт·ч
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
        ]
    },
    min_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    max_price: {
        excl_vat: 0,
        incl_vat: 0
    },
    start_date_time: 0,
    end_date_time: 0,
    energy_mix: {
        is_green_energy: true,
        energy_sources: [{
            source: 1,
            percentage: 10,
        }],
        environ_impact: [{
            category: 1,
            amount: 10
        }],
        supplier_name: "test",
        energy_product_name: "test"
    }
}

module.exports = {free_tariff, energy_tariff}