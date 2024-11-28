const free_tariff = {
    currency: 1,
    _type: 1,
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
                    vat:0,
                    step_size:0
                }
            ],
            restrictions: {
                start_unixtime:0,
                end_unixtime:0,
                min_kwh:0,
                max_kwh:0,
                min_current:0,
                max_current:0,
                min_power:0,
                max_power:0,
                min_duration:0,
                max_duration:0,
                day_of_week:[0],
                reservation:0
            }
        }
    ]
}

const energy_mix = {
    is_green_energy: true,
    energy_sources: [{
        source: 1,
        percentage:10,
    }],
    environ_impact: [{
        category: 1,
        amount:10
    }],
    supplier_name: "test",
    energy_product_name: "test"
}

module.exports = {free_tariff,energy_mix}