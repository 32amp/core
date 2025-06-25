
module.exports.GenerateRandomAddress = function() {
    const ethers = require("ethers");  
    const crypto = require("crypto");

    const id = crypto.randomBytes(32).toString("hex");
    const privateKey = "0x"+id;

    const wallet = new ethers.Wallet(privateKey);

    return {
        privateKey: privateKey,
        publicKey: wallet.address
    }
}

module.exports.getEventArguments = async function(transaction, eventName, wait ) {
    const result = await transaction.wait(wait);
    
    for (let index = 0; index < result.logs.length; index++) {
        const event = result.logs[index];
        if(event.fragment?.name == eventName){
            return event.args
        } 
    }

    return false;
}

module.exports.hex2string = function(hexx) {
    var hex = hexx.toString().replace("0x","");//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2){
        let char = hex.substr(i, 2);
        if(char == "00")
            continue;

        str += String.fromCharCode(parseInt(char, 16));
    }
    return str;
}

/**
 * Генерирует случайные точки геолокации в заданной прямоугольной области
 * @param {Object} sw - Юго-западная граница области {lat: number, lng: number}
 * @param {Object} ne - Северо-восточная граница области {lat: number, lng: number}
 * @param {number} count - Количество точек для генерации
 * @returns {Array} Массив объектов {lat: number, lng: number}
 */
module.exports.generateGeoPoints = function(sw, ne, count) {
    const points = [];
    
    for (let i = 0; i < count; i++) {
        // Генерация случайной широты в пределах области
        const lat = Math.random() * (ne.lat - sw.lat) + sw.lat;
        
        // Генерация случайной долготы с учетом пересечения 180-го меридиана
        let lng;
        if (sw.lng <= ne.lng) {
            // Стандартный случай (без пересечения)
            lng = Math.random() * (ne.lng - sw.lng) + sw.lng;
        } else {
            // Случай с пересечением 180-го меридиана
            const range = (180 - sw.lng) + (ne.lng + 180);
            const random = Math.random() * range;
            
            lng = random < (180 - sw.lng) 
                ? sw.lng + random 
                : -180 + (random - (180 - sw.lng));
        }
        
        points.push({ latitude:lat.toString(), longitude: lng.toString() });
    }
    
    return points;
}

module.exports.generateLocationName = function(capital) {
    
    const templates = [
        `${capital} Central Charging Hub`,
        `${capital} International Airport Station`,
        `${capital} Downtown Municipal Park`,
        `${capital} Tesla Supercharger Center`,
        `${capital} Financial District Underground`,
        `${capital} Green Energy Solar Center`,
        `${capital} Luxury Hotel Valet Station`,
        `${capital} Ring Road Fast Charging Oasis`,
        `${capital} Tech District Smart Plaza`,
        `${capital} Ski Resort Winter Station`,
        `${capital} Urban Garden Charging`,
        `${capital} Industrial Fleet Depot`,
        `${capital} Historic District Heritage Station`,
        `${capital} Drive-in Movie Theater`,
        `${capital} Boutique Premium Lounge`,
        `${capital} Emergency Services Hub`,
        `${capital} Shopping Center Rooftop`,
        `${capital} Festival Mobile Units`,
        `${capital} Riverfront Marina Pier`,
        `${capital} Smart City V2G Hub`,
        `${capital} Mountain View Station`,
        `${capital} Diamond District Secure`,
        `${capital} University Research Lab`,
        `${capital} Vintage EV Club`,
        `${capital} Border Crossing Hub`,
        `${capital} Harbor Floating Pontoons`,
        `${capital} Desert Oasis Station`,
        `${capital} Autonomous Robotic Garage`,
        `${capital} Art Gallery Designer Station`,
        `${capital} Winter Sports Hub`,
        `${capital} Central Station`,
        `${capital} Tech Park`,
        `${capital} Mall North`,
        `${capital} Airport Terminal`,
        `${capital} City Hall Plaza`,
        `${capital} Highway A1 Rest Stop`,
        `${capital} IKEA Shopping Center`,
        `${capital} University Campus`,
        `${capital} Marina Waterfront`,
        `${capital} Hospital Medical Center`,
        `${capital} Outlet Village`,
        `${capital} Zoo Wildlife Park`,
        `${capital} Stadium Sports Complex`,
        `${capital} Business District`,
        `${capital} Park West`,
        `${capital} Hotel Grand`,
        `${capital} Police Headquarters`,
        `${capital} Convention Center`,
        `${capital} Taxi Rank`,
        `${capital} Cineplex Entertainment`,
        `${capital} Museum Cultural Center`,
        `${capital} Rest Stop East`,
        `${capital} University Research`,
        `${capital} Golf Club`,
        `${capital} Ski Resort`,
        `${capital} Camping Grounds`,
        `${capital} Ferry Terminal`,
        `${capital} Library Knowledge Center`,
        `${capital} Factory Outlet`,
        `${capital} Municipal Center`
    ];
  
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return randomTemplate;
  }

module.exports.generateLocationDescription = function(capital) {
    
    const templates = [
        `Main charging hub in ${capital} downtown features 12 ultra-fast 350kW stations with CCS/CHAdeMO connectors. Open 24/7 with security monitoring. $0.35/kWh with monthly membership discounts available.`,
        `Premium charging experience at ${capital} International Airport with 8 reserved EV spaces. 150-350kW chargers with lounge access (showers, WiFi). First 30min free for all passengers.`,
        `Municipal charging park in ${capital} city center offers 6x 22kW AC stations. Free for residents (2h limit), others pay $0.25/kWh. Perfect for shopping district visitors.`,
        `Tesla Supercharger station near ${capital} highway interchange with 16 V3 stalls. 250kW peak charging. Café and rest area available. Exclusive for Tesla vehicles.`,
        `Underground charging facility in ${capital} financial district with 4x 50kW DC stations. Validated parking ($5/h waived with $20 purchase at partner stores).`,
        `Green energy charging center in ${capital} features solar-powered 150kW stations. Battery buffered for night operations. Member priority, public access when available.`,
        `Luxury hotel charging in ${capital} offers 4x 22kW AC stations for guests only. Included with room reservation ($15/night for visitors). Valet service available.`,
        `Fast charging oasis on ${capital} ring road features 6x 350kW stations with liquid cooling. 24/7 attended service with tire inflation and vacuum stations.`,
        `Smart charging plaza in ${capital} tech district with dynamic load balancing across 12 stalls (50-150kW). Real-time availability in city EV app. Priority for carsharing fleets.`,
        `Winter-ready charging station near ${capital} ski resort features heated bays for 8 vehicles. 150kW CCS with battery preconditioning. Includes ski gear drying area.`,
        `Urban charging garden in ${capital} features 6 stalls (50kW) surrounded by green space. Free WiFi, pet area. Payment via app only. No overnight parking.`,
        `Fleet charging depot in ${capital} industrial zone offers 20x 50kW stations. Business accounts only. 24/7 security. Bulk pricing available.`,
        `Historic district charging in ${capital} with 4x discreet 22kW posts. Limited to 4 hours. Special rates for heritage EV owners. Includes guided tour tablet.`,
        `Drive-in charging theater near ${capital} features 30 stalls (11kW) with large screen. Movie ticket includes 4h charging. Food delivery to your car available.`,
        `Boutique charging lounge in ${capital} offers 4x 350kW stations with premium amenities. $1 connection fee + $0.45/kWh. Includes massaging seats and AR display.`,
        `Emergency services charging hub in ${capital} features 6 reserved 150kW stations. Public access when not in use by police/ambulances. ID verification required.`,
        `Rooftop charging garden in ${capital} shopping center with panoramic views. 8x 50kW stations. Free for customers spending $100+. Opening hours 8AM-11PM.`,
        `Mobile charging units in ${capital} event district deploy during festivals. 10x battery-buffered 50kW trailers. Dynamic pricing based on demand.`,
        `Riverfront charging pier in ${capital} features 6 waterproof 150kW stations. Free for first hour with marina receipt. Fishing gear rentals available.`,
        `Smart city demonstration hub in ${capital} features V2G-enabled 50kW chargers. Earn credits by supplying power to grid during peak hours.`,
        `Mountain view charging station outside ${capital} offers 4x 150kW posts. Includes hiking trail maps and picnic area. No cellular signal - offline payment only.`,
        `Underground secure charging in ${capital} diamond district. 4x 50kW stations behind biometric access. $10/h includes car detailing service.`,
        `University research charging lab in ${capital} offers experimental 350kW+ stations. Open for public testing with waiver. Data collection required.`,
        `Vintage EV charging club in ${capital} features period-correct 6kW stations for classic electric vehicles. Members only. Tea lounge included.`,
        `Border crossing charging hub near ${capital} offers 12 multilingual 150kW stations. Currency exchange available. Customs office on-site for import paperwork.`,
        `Floating charging pontoons in ${capital} harbor serve electric boats and cars. 4x waterproof 50kW stations. Tide schedule affects access.`,
        `Desert-themed charging oasis in ${capital} features cooled 350kW stations. Palm shade structures, free date snacks. Sand removal service $5.`,
        `Autonomous charging garage in ${capital} features robotic plug-in for 20 vehicles. 50-150kW. Additional $3 for interior cleaning during charge.`,
        `Art gallery charging station in ${capital} offers 4 designer 22kW posts. Free with museum ticket. Changing digital art displays during charge.`,
        `Winter sports charging hub near ${capital} features heated cables and battery blankets. 6x 150kW stations. Ski/snowboard storage available.`
    ];
  
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return randomTemplate;
}

module.exports.generateEVSEDescription = function() {
    
    const templates = [
        "Located on underground parking (level -1), featuring bright red columns with contrasting black stripes. 6 charging bays with convenient access. 24/7 availability via access card or mobile app.",
        "Modern blue charging station at business district main entrance. 4 high-power units under transparent protective canopies. 24-hour security with CCTV monitoring.",
        "Eco-station in park area with wooden finish and green lighting. 8 charging spots among trees, each equipped with info screen and emergency call button.",
        "Futuristic mirror-surface station on shopping mall rooftop. Panoramic city views. 12 ultra-fast ports under rotating solar panels.",
        "Retro-designed station in historic district. Cast iron columns styled as vintage street lamps. 6 charging points with golden night lighting.",
        "Temporary exhibition center station with bright orange modules. 4 vandalism-proof high-power charging units on mobile platform.",
        "Premium underground station at luxury hotel. Black marble finish with gold lighting. Includes concierge services (window cleaning, device charging) during session.",
        "Minimalist station near office complex. Glossy white columns with clean design. 8 universal ports with phone induction charging pads.",
        "Art installation-style station by modern art museum. Abstract metal structures change color based on charging speed. 4 available stations.",
        "Nature-inspired station in botanical garden. Charging pillars designed as tree trunks with live plants. 6 eco-ports with solar support.",
        "High-tech highway station. Aerodynamic design with blue neon lighting. 12 ultra-fast ports, driver lounge and café available.",
        "Nautical-themed station at waterfront. Blue wave-pattern panels with water-effect lighting. 8 ports with salt-air protection.",
        "Family-friendly station near mall. Colorful toy-shaped columns. 4 child-height ports with interactive game panels.",
        "Modular station at convention center. Configurable layout supports 16 ports with power scaling capability.",
        "Vintage 1950s-style station at auto museum. Retro gas pump design with modern technology. 4 themed charging points.",
        "Tempered glass station in futuristic district. Night lighting creates 3D effects. 8 ports with touch interfaces.",
        "AR-enhanced station. Interactive displays appear when connected. 6 ports with vehicle recognition technology.",
        "Mushroom-canopy station in park area. Weather protection with built-in benches. 10 ports with USB outlets.",
        "High-tech station at innovation park. Metal construction with holographic UI. 12 maximum-power ports.",
        "Digital art gallery station. Monthly changing artist-designed interfaces. 6 ports with NFT receipt option.",
        "Colonial-style station at historic hotel. Wood paneling with copper accents. 4 classically-designed ports.",
        "Book-themed station near library. Panel designs resemble bookshelves. 6 ports with e-library access during charging.",
        "Nightlife district station with disco balls and neon. 8 ports with drink ordering from nearby bar.",
        "Steampunk-themed station. Decorative gears and pipes. 4 ports with analog power meters.",
        "Space capsule station at science museum. Futuristic spacecraft design. 6 ports with thematic lighting.",
        "Compact station for historic district narrow streets. Space-saving design matching local architecture. 2 ports.",
        "Desert oasis station with greenery and water features. 8 sand-proof ports with cooling system.",
        "Sports complex station with Olympic rings motif. 5 differently-colored ports with fitness stats display.",
        "Mountain resort station. Stone and wood materials. 6 ports with connector heating for cold weather.",
        "Located on underground parking level -1, red color scheme",
        "Near main entrance with blue charging pillars",
        "Parking spots marked with green outlines",
        "Behind glass partition with yellow accent lighting",
        "Under canopy with gray columns",
        "Adjacent to café, black charging stands",
        "By administrative building, white charging units",
        "On shopping mall rooftop, orange safety barriers",
        "At far end of parking lot, purple pillars",
        "Near fountain area, mirrored surface finish",
        "Underground with elevator access, matte panels",
        "Close to playground, striped design pattern",
        "Around the corner, illuminated edges",
        "In green park area, wooden exterior",
        "On bridge structure, transparent panels",
        "Inside tunnel, neon lighting accents",
        "At safety island, lattice enclosure",
        "Next to bike racks, graffiti artwork panels",
        "In winter garden, living plants on housing",
        "At express parking, holographic indicators"
    ];
  
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return randomTemplate;
}

module.exports.generateLocationAddress = function(capital) {
    
    const streetNames = [
        "Main Street",
        "Central Avenue",
        "Park Boulevard",
        "Riverside Drive",
        "Ocean View Road",
        "Mountain Highway",
        "Business District Way",
        "University Boulevard",
        "Shopping Center Drive",
        "Airport Terminal Road",
        "Harbor Front Street",
        "Industrial Zone Avenue",
        "Residential Quarter Lane",
        "Downtown Plaza",
        "Tech Park Drive",
        "Cultural District Street",
        "Sports Complex Road",
        "Medical Center Boulevard",
        "Transport Hub Avenue",
        "Entertainment District Way",
        "Historic Quarter Street",
        "Green Park Lane",
        "Financial District Road",
        "Tourist Zone Avenue",
        "Educational Campus Drive",
        "Recreation Area Street",
        "Commercial Hub Boulevard",
        "Service Center Road",
        "Public Square",
        "Community Center Lane",
        "Innovation District Way",
        "Heritage Quarter Street",
        "Modern Complex Avenue",
        "Leisure Zone Drive",
        "Professional District Road",
        "Urban Development Street",
        "Suburban Center Boulevard",
        "Metropolitan Area Way",
        "City Extension Lane",
        "Growth District Road",
        "Development Zone Avenue",
        "Expansion Area Street",
        "New Quarter Boulevard",
        "Emerging District Way",
        "Future Zone Lane",
        "Progressive Area Road",
        "Advancement Street",
        "Evolution District Avenue",
        "Transformation Zone Drive",
        "Modernization Road",
        "Innovation Quarter Street"
    ];

    const buildingNumbers = [
        "1", "2", "3", "5", "7", "9", "10", "12", "15", "17", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100", "105", "110", "115", "120", "125", "130", "135", "140", "145", "150", "155", "160", "165", "170", "175", "180", "185", "190", "195", "200"
    ];


    const randomStreet = streetNames[Math.floor(Math.random() * streetNames.length)];
    const randomNumber = buildingNumbers[Math.floor(Math.random() * buildingNumbers.length)];

    return `${randomNumber} ${randomStreet}`;
}

module.exports.generateFacilities = function() {
    // Enum Facility values (0-20)
    const facilityValues = [
        0,  // None
        1,  // Hotel
        2,  // Restaurant
        3,  // Cafe
        4,  // Mall
        5,  // Supermarket
        6,  // Sport
        7,  // RecreationArea
        8,  // Nature
        9,  // Museum
        10, // BikeSharing
        11, // BusStop
        12, // TaxiStand
        13, // TramStop
        14, // MetroStation
        15, // TrainStation
        16, // Airport
        17, // ParkingLot
        18, // CarpoolParking
        19, // FuelStation
        20  // Wifi
    ];
    
    // Генерируем случайное количество объектов (от 1 до 8)
    const count = Math.floor(Math.random() * 8) + 1;
    
    // Создаем массив для результата
    const selectedFacilities = [];
    
    // Выбираем случайные объекты, исключая None (0)
    const availableFacilities = facilityValues.slice(1); // Исключаем None
    
    for (let i = 0; i < count; i++) {
        // Выбираем случайный индекс из доступных объектов
        const randomIndex = Math.floor(Math.random() * availableFacilities.length);
        const selectedFacility = availableFacilities[randomIndex];
        
        // Добавляем только если его еще нет в массиве (избегаем дубликатов)
        if (!selectedFacilities.includes(selectedFacility)) {
            selectedFacilities.push(selectedFacility);
        }
        
        // Если все объекты уже выбраны, прерываем цикл
        if (selectedFacilities.length >= availableFacilities.length) {
            break;
        }
    }
    
    return selectedFacilities;
}

// Генерация страны по столице
module.exports.generateCountry = function(capital) {
    // Примитивная карта соответствий, можно расширить
    const map = {
        'Moscow': 'Russia',
        'Berlin': 'Germany',
        'Paris': 'France',
        'London': 'United Kingdom',
        'Rome': 'Italy',
        'Madrid': 'Spain',
        'Beijing': 'China',
        'Tokyo': 'Japan',
        'Washington': 'USA',
        'Ottawa': 'Canada',
        'Brasilia': 'Brazil',
        'Canberra': 'Australia',
        'New Delhi': 'India',
        'Astana': 'Kazakhstan',
        'Minsk': 'Belarus',
        'Kyiv': 'Ukraine',
        'Warsaw': 'Poland',
        'Vienna': 'Austria',
        'Prague': 'Czech Republic',
        'Budapest': 'Hungary',
        'Oslo': 'Norway',
        'Stockholm': 'Sweden',
        'Helsinki': 'Finland',
        'Copenhagen': 'Denmark',
        'Bern': 'Switzerland',
        'Brussels': 'Belgium',
        'Amsterdam': 'Netherlands',
        'Lisbon': 'Portugal',
        'Athens': 'Greece',
        'Sofia': 'Bulgaria',
        'Bucharest': 'Romania',
        'Ankara': 'Turkey',
        'Tbilisi': 'Georgia',
        'Yerevan': 'Armenia',
        'Baku': 'Azerbaijan',
        'Riga': 'Latvia',
        'Vilnius': 'Lithuania',
        'Tallinn': 'Estonia',
        'Chisinau': 'Moldova',
        'Zagreb': 'Croatia',
        'Sarajevo': 'Bosnia and Herzegovina',
        'Belgrade': 'Serbia',
        'Podgorica': 'Montenegro',
        'Skopje': 'North Macedonia',
        'Ljubljana': 'Slovenia',
        'Tirana': 'Albania',
        'Reykjavik': 'Iceland',
        'Dublin': 'Ireland',
        'Luxembourg': 'Luxembourg',
        'Monaco': 'Monaco',
        'San Marino': 'San Marino',
        'Vatican': 'Vatican City',
        'Andorra la Vella': 'Andorra',
        'Valletta': 'Malta',
        'Bratislava': 'Slovakia',
        'Kiev': 'Ukraine',
        'Saint Petersburg': 'Russia',
        'Nur-Sultan': 'Kazakhstan',
    };
    return map[capital] || 'Unknown';
}

// Генерация почтового кода на основе capital (или случайно)
module.exports.generatePostalCode = function(capital) {
    // Можно сделать карту, но для универсальности - случайно из существующих
    const postalCodes = [
        "10001", "20002", "30003", "40004", "50005", "60006", "70007", "80008", "90009", "11001", "12002", "13003", "14004", "15005", "16006", "17007", "18008", "19009", "21001", "22002", "23003", "24004", "25005", "26006", "27007", "28008", "29009", "31001", "32002", "33003", "34004", "35005", "36006", "37007", "38008", "39009", "41001", "42002", "43003", "44004", "45005", "46006", "47007", "48008", "49009"
    ];
    return ethers.encodeBytes32String(postalCodes[Math.floor(Math.random() * postalCodes.length)]);
}

// Генерация parking_type (enum)
module.exports.generateParkingType = function() {
    // Enum ParkingType: 0-6
    const parkingTypes = [
        0, // None
        1, // AlongMotorway
        2, // ParkingGarage
        3, // ParkingLot
        4, // OnDriveway
        5, // OnStreet
        6  // UndergroundGarage
    ];
    // Случайный выбор, кроме None (0) для реалистичности
    return parkingTypes[Math.floor(Math.random() * (parkingTypes.length - 1)) + 1];
}

// Генерация time_zone на основе столицы
module.exports.generateTimeZone = function(capital) {
    // Примитивная карта, можно расширить
    const map = {
        'Moscow': 'Europe/Moscow',
        'Berlin': 'Europe/Berlin',
        'Paris': 'Europe/Paris',
        'London': 'Europe/London',
        'Rome': 'Europe/Rome',
        'Madrid': 'Europe/Madrid',
        'Beijing': 'Asia/Shanghai',
        'Tokyo': 'Asia/Tokyo',
        'Washington': 'America/New_York',
        'Ottawa': 'America/Toronto',
        'Brasilia': 'America/Sao_Paulo',
        'Canberra': 'Australia/Sydney',
        'New Delhi': 'Asia/Kolkata',
        'Astana': 'Asia/Almaty',
        'Minsk': 'Europe/Minsk',
        'Kyiv': 'Europe/Kyiv',
        'Warsaw': 'Europe/Warsaw',
        'Vienna': 'Europe/Vienna',
        'Prague': 'Europe/Prague',
        'Budapest': 'Europe/Budapest',
        'Oslo': 'Europe/Oslo',
        'Stockholm': 'Europe/Stockholm',
        'Helsinki': 'Europe/Helsinki',
        'Copenhagen': 'Europe/Copenhagen',
        'Bern': 'Europe/Zurich',
        'Brussels': 'Europe/Brussels',
        'Amsterdam': 'Europe/Amsterdam',
        'Lisbon': 'Europe/Lisbon',
        'Athens': 'Europe/Athens',
        'Sofia': 'Europe/Sofia',
        'Bucharest': 'Europe/Bucharest',
        'Ankara': 'Europe/Istanbul',
        'Tbilisi': 'Asia/Tbilisi',
        'Yerevan': 'Asia/Yerevan',
        'Baku': 'Asia/Baku',
        'Riga': 'Europe/Riga',
        'Vilnius': 'Europe/Vilnius',
        'Tallinn': 'Europe/Tallinn',
        'Chisinau': 'Europe/Chisinau',
        'Zagreb': 'Europe/Zagreb',
        'Sarajevo': 'Europe/Sarajevo',
        'Belgrade': 'Europe/Belgrade',
        'Podgorica': 'Europe/Podgorica',
        'Skopje': 'Europe/Skopje',
        'Ljubljana': 'Europe/Ljubljana',
        'Tirana': 'Europe/Tirane',
        'Reykjavik': 'Atlantic/Reykjavik',
        'Dublin': 'Europe/Dublin',
        'Luxembourg': 'Europe/Luxembourg',
        'Monaco': 'Europe/Monaco',
        'San Marino': 'Europe/San_Marino',
        'Vatican': 'Europe/Vatican',
        'Andorra la Vella': 'Europe/Andorra',
        'Valletta': 'Europe/Malta',
        'Bratislava': 'Europe/Bratislava',
        'Kiev': 'Europe/Kyiv',
        'Saint Petersburg': 'Europe/Moscow',
        'Nur-Sultan': 'Asia/Almaty',
    };
    return map[capital] || 'Europe/Moscow';
}

// Генерация state/области/региона на основе столицы
module.exports.generateState = function(capital) {
    // Карта соответствий столиц и регионов/штатов
    const map = {
        'Moscow': 'Moscow Oblast',
        'Saint Petersburg': 'Leningrad Oblast',
        'Berlin': 'Berlin',
        'Paris': 'Île-de-France',
        'London': 'Greater London',
        'Rome': 'Lazio',
        'Madrid': 'Community of Madrid',
        'Barcelona': 'Catalonia',
        'Beijing': 'Beijing Municipality',
        'Shanghai': 'Shanghai Municipality',
        'Tokyo': 'Tokyo Prefecture',
        'Washington': 'District of Columbia',
        'New York': 'New York',
        'Los Angeles': 'California',
        'Chicago': 'Illinois',
        'Ottawa': 'Ontario',
        'Toronto': 'Ontario',
        'Vancouver': 'British Columbia',
        'Brasilia': 'Federal District',
        'São Paulo': 'São Paulo',
        'Rio de Janeiro': 'Rio de Janeiro',
        'Canberra': 'Australian Capital Territory',
        'Sydney': 'New South Wales',
        'Melbourne': 'Victoria',
        'New Delhi': 'Delhi',
        'Mumbai': 'Maharashtra',
        'Bangalore': 'Karnataka',
        'Astana': 'Akmola Region',
        'Almaty': 'Almaty Region',
        'Minsk': 'Minsk Region',
        'Kyiv': 'Kyiv Oblast',
        'Warsaw': 'Masovian Voivodeship',
        'Vienna': 'Vienna',
        'Prague': 'Prague',
        'Budapest': 'Central Hungary',
        'Oslo': 'Oslo',
        'Stockholm': 'Stockholm County',
        'Helsinki': 'Uusimaa',
        'Copenhagen': 'Capital Region',
        'Bern': 'Bern',
        'Zurich': 'Zurich',
        'Brussels': 'Brussels-Capital Region',
        'Amsterdam': 'North Holland',
        'Rotterdam': 'South Holland',
        'Lisbon': 'Lisbon District',
        'Porto': 'Porto District',
        'Athens': 'Attica',
        'Sofia': 'Sofia City Province',
        'Bucharest': 'Bucharest',
        'Ankara': 'Ankara Province',
        'Istanbul': 'Istanbul Province',
        'Tbilisi': 'Tbilisi',
        'Yerevan': 'Yerevan',
        'Baku': 'Baku',
        'Riga': 'Riga',
        'Vilnius': 'Vilnius County',
        'Tallinn': 'Harju County',
        'Chisinau': 'Chisinau Municipality',
        'Zagreb': 'City of Zagreb',
        'Sarajevo': 'Sarajevo Canton',
        'Belgrade': 'Belgrade',
        'Podgorica': 'Podgorica',
        'Skopje': 'Skopje Statistical Region',
        'Ljubljana': 'Central Slovenia Statistical Region',
        'Tirana': 'Tirana County',
        'Reykjavik': 'Capital Region',
        'Dublin': 'County Dublin',
        'Luxembourg': 'Luxembourg',
        'Monaco': 'Monaco',
        'San Marino': 'San Marino',
        'Vatican': 'Vatican City',
        'Andorra la Vella': 'Andorra la Vella',
        'Valletta': 'Southern Region',
        'Bratislava': 'Bratislava Region',
        'Kiev': 'Kyiv Oblast',
        'Nur-Sultan': 'Akmola Region',
        'Munich': 'Bavaria',
        'Hamburg': 'Hamburg',
        'Frankfurt': 'Hesse',
        'Cologne': 'North Rhine-Westphalia',
        'Düsseldorf': 'North Rhine-Westphalia',
        'Stuttgart': 'Baden-Württemberg',
        'Dresden': 'Saxony',
        'Leipzig': 'Saxony',
        'Nuremberg': 'Bavaria',
        'Bremen': 'Bremen',
        'Hannover': 'Lower Saxony',
        'Dortmund': 'North Rhine-Westphalia',
        'Essen': 'North Rhine-Westphalia',
        'Duisburg': 'North Rhine-Westphalia',
        'Bochum': 'North Rhine-Westphalia',
        'Wuppertal': 'North Rhine-Westphalia',
        'Bielefeld': 'North Rhine-Westphalia',
        'Bonn': 'North Rhine-Westphalia',
        'Mannheim': 'Baden-Württemberg',
        'Karlsruhe': 'Baden-Württemberg',
        'Wiesbaden': 'Hesse',
        'Gelsenkirchen': 'North Rhine-Westphalia',
        'Münster': 'North Rhine-Westphalia',
        'Aachen': 'North Rhine-Westphalia',
        'Braunschweig': 'Lower Saxony',
        'Chemnitz': 'Saxony',
        'Kiel': 'Schleswig-Holstein',
        'Halle': 'Saxony-Anhalt',
        'Magdeburg': 'Saxony-Anhalt',
        'Freiburg': 'Baden-Württemberg',
        'Krefeld': 'North Rhine-Westphalia',
        'Lübeck': 'Schleswig-Holstein',
        'Oberhausen': 'North Rhine-Westphalia',
        'Erfurt': 'Thuringia',
        'Mainz': 'Rhineland-Palatinate',
        'Rostock': 'Mecklenburg-Vorpommern',
        'Kassel': 'Hesse',
        'Hagen': 'North Rhine-Westphalia',
        'Potsdam': 'Brandenburg',
        'Saarbrücken': 'Saarland',
        'Hamm': 'North Rhine-Westphalia',
        'Mülheim': 'North Rhine-Westphalia',
        'Ludwigshafen': 'Rhineland-Palatinate',
        'Leverkusen': 'North Rhine-Westphalia',
        'Oldenburg': 'Lower Saxony',
        'Osnabrück': 'Lower Saxony',
        'Solingen': 'North Rhine-Westphalia',
        'Heidelberg': 'Baden-Württemberg',
        'Herne': 'North Rhine-Westphalia',
        'Neuss': 'North Rhine-Westphalia',
        'Darmstadt': 'Hesse',
        'Paderborn': 'North Rhine-Westphalia',
        'Regensburg': 'Bavaria',
        'Ingolstadt': 'Bavaria',
        'Würzburg': 'Bavaria',
        'Fürth': 'Bavaria',
        'Wolfsburg': 'Lower Saxony',
        'Offenbach': 'Hesse',
        'Ulm': 'Baden-Württemberg',
        'Heilbronn': 'Baden-Württemberg',
        'Pforzheim': 'Baden-Württemberg',
        'Göttingen': 'Lower Saxony',
        'Bottrop': 'North Rhine-Westphalia',
        'Trier': 'Rhineland-Palatinate',
        'Recklinghausen': 'North Rhine-Westphalia',
        'Reutlingen': 'Baden-Württemberg',
        'Bremerhaven': 'Bremen',
        'Koblenz': 'Rhineland-Palatinate',
        'Bergisch Gladbach': 'North Rhine-Westphalia',
        'Jena': 'Thuringia',
        'Remscheid': 'North Rhine-Westphalia',
        'Erlangen': 'Bavaria',
        'Moers': 'North Rhine-Westphalia',
        'Siegen': 'North Rhine-Westphalia',
        'Hildesheim': 'Lower Saxony',
        'Salzgitter': 'Lower Saxony',
        'Cottbus': 'Brandenburg',
        'Gera': 'Thuringia',
        'Kaiserslautern': 'Rhineland-Palatinate',
        'Schwerin': 'Mecklenburg-Vorpommern',
        'Düren': 'North Rhine-Westphalia',
        'Esslingen': 'Baden-Württemberg',
        'Tübingen': 'Baden-Württemberg',
        'Flensburg': 'Schleswig-Holstein',
        'Zwickau': 'Saxony',
        'Gießen': 'Hesse',
        'Lünen': 'North Rhine-Westphalia',
        'Düseldorf': 'North Rhine-Westphalia',
        'Witten': 'North Rhine-Westphalia',
        'Schwerte': 'North Rhine-Westphalia',
        'Erlangen': 'Bavaria',
        'Iserlohn': 'North Rhine-Westphalia',
        'Trier': 'Rhineland-Palatinate',
        'Koblenz': 'Rhineland-Palatinate',
        'Jena': 'Thuringia',
        'Gera': 'Thuringia',
        'Flensburg': 'Schleswig-Holstein',
        'Cottbus': 'Brandenburg',
        'Villingen-Schwenningen': 'Baden-Württemberg',
        'Konstanz': 'Baden-Württemberg',
        'Worms': 'Rhineland-Palatinate',
        'Wilhelmshaven': 'Lower Saxony',
        'Dorsten': 'North Rhine-Westphalia',
        'Lüdenscheid': 'North Rhine-Westphalia',
        'Landshut': 'Bavaria',
        'Brandenburg': 'Brandenburg',
        'Celle': 'Lower Saxony',
        'Passau': 'Bavaria',
        'Hof': 'Bavaria',
        'Freiburg': 'Baden-Württemberg',
        'Kassel': 'Hesse',
        'Trier': 'Rhineland-Palatinate',
        'Koblenz': 'Rhineland-Palatinate',
        'Jena': 'Thuringia',
        'Gera': 'Thuringia',
        'Flensburg': 'Schleswig-Holstein',
        'Cottbus': 'Brandenburg',
        'Villingen-Schwenningen': 'Baden-Württemberg',
        'Konstanz': 'Baden-Württemberg',
        'Worms': 'Rhineland-Palatinate',
        'Wilhelmshaven': 'Lower Saxony',
        'Dorsten': 'North Rhine-Westphalia',
        'Lüdenscheid': 'North Rhine-Westphalia',
        'Landshut': 'Bavaria',
        'Brandenburg': 'Brandenburg',
        'Celle': 'Lower Saxony',
        'Passau': 'Bavaria',
        'Hof': 'Bavaria'
    };
    
    return map[capital] || 'Unknown Region';
}

// Генерация openingTimes объекта
module.exports.generateOpeningTimes = function() {
    // Случайно выбираем тип расписания
    const scheduleType = Math.floor(Math.random() * 4); // 0-3
    
    // 25% вероятность работы 24/7
    const twentyfourseven = scheduleType === 0;
    
    if (twentyfourseven) {
        return {
            twentyfourseven: true,
            regular_hours: [],
            exceptional_openings: [],
            exceptional_closings: []
        };
    }
    
    // Генерируем обычные часы работы
    const regular_hours = [];
    const weekDays = [1, 2, 3, 4, 5, 6, 7]; // Понедельник - Воскресенье
    
    // Различные шаблоны расписания
    const scheduleTemplates = [
        // Будни 9-18, выходные 10-16
        {
            weekdays: { begin: "9:00", end: "18:00" },
            weekends: { begin: "10:00", end: "16:00" }
        },
        // Будни 8-20, выходные 9-17
        {
            weekdays: { begin: "8:00", end: "20:00" },
            weekends: { begin: "9:00", end: "17:00" }
        },
        // Будни 7-22, выходные 8-20
        {
            weekdays: { begin: "7:00", end: "22:00" },
            weekends: { begin: "8:00", end: "20:00" }
        },
        // Будни 6-23, выходные 7-21
        {
            weekdays: { begin: "6:00", end: "23:00" },
            weekends: { begin: "7:00", end: "21:00" }
        },
        // Будни 10-19, выходные 11-18
        {
            weekdays: { begin: "10:00", end: "19:00" },
            weekends: { begin: "11:00", end: "18:00" }
        }
    ];
    
    const selectedTemplate = scheduleTemplates[Math.floor(Math.random() * scheduleTemplates.length)];
    
    // Добавляем часы для каждого дня недели
    weekDays.forEach(week_day => {
        const isWeekend = week_day === 6 || week_day === 7; // Суббота или воскресенье
        const hours = isWeekend ? selectedTemplate.weekends : selectedTemplate.weekdays;
        
        regular_hours.push({
            week_day: week_day,
            period_begin: hours.begin,
            period_end: hours.end
        });
    });
    
    
    const exceptional_openings = [];
    if (Math.random() < 0.3) {
        const numOpenings = Math.floor(Math.random() * 3) + 1; 
        for (let i = 0; i < numOpenings; i++) {
            exceptional_openings.push({
                begin: Math.floor(Math.random() * 24), 
                end: Math.floor(Math.random() * 24)    
            });
        }
    }
    
    
    const exceptional_closings = [];
    if (Math.random() < 0.2) {
        const numClosings = Math.floor(Math.random() * 2) + 1; 
        for (let i = 0; i < numClosings; i++) {
            exceptional_closings.push({
                begin: Math.floor(Math.random() * 24), 
                end: Math.floor(Math.random() * 24)    
            });
        }
    }
    
    return {
        twentyfourseven: false,
        regular_hours: regular_hours,
        exceptional_openings: exceptional_openings,
        exceptional_closings: exceptional_closings
    };
}

// Генерация charging_when_closed (булево)
module.exports.generateChargingWhenClosed = function() {
    return Math.random() < 0.5;
}


// Генерация physical_reference на английском языке
module.exports.generatePhysicalReference = function() {
    const references = [
        "Next to the red brick building",
        "Behind the glass office tower",
        "Near the main entrance gate",
        "Adjacent to the parking garage",
        "Opposite the shopping mall",
        "Beside the bus station",
        "Close to the train tracks",
        "In front of the hotel lobby",
        "Behind the gas station",
        "Opposite the bank building",
        "Beside the post office",
        "Close to the police station",
        "Behind the school building",
        "Near the library entrance",
        "Adjacent to the museum",
        "Opposite the theater",
        "Beside the cinema",
        "Close to the restaurant",
        "In front of the café",
        "Behind the supermarket",
        "Near the pharmacy",
        "Adjacent to the gym",
        "Opposite the sports center",
        "Beside the swimming pool",
        "Close to the tennis court",
        "In front of the golf course",
        "Behind the stadium",
        "Near the airport terminal",
        "Adjacent to the harbor",
        "Opposite the marina",
        "Beside the ferry dock",
        "Close to the bridge",
        "Behind the highway exit",
        "Near the rest area",
        "Adjacent to the truck stop",
        "Opposite the car wash",
        "Beside the auto repair shop",
        "Close to the tire center",
        "In front of the car dealership",
        "Behind the motorcycle shop",
        "Near the bicycle store",
        "Adjacent to the hardware store",
        "Opposite the furniture store",
        "Beside the electronics shop",
        "Close to the clothing store"
    ]
    const el = Math.floor(Math.random() * references.length);

    return ethers.encodeBytes32String(references[el]);
}

// Генерация объекта EVSEmeta
module.exports.generateEVSEmeta = function(coordinates) {
    const { ethers } = require("ethers");
    
    // Генерация status_schedule (расписание статусов)
    const status_schedule = [];
    const statusTypes = [1, 2, 3, 4, 5, 6]; // Available, Blocked, Charging, Inoperative, Reserved, Maintenance
    
    // 30% вероятность наличия расписания статусов
    if (Math.random() < 0.3) {
        const numSchedules = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numSchedules; i++) {
            const now = Math.floor(Date.now() / 1000);
            const begin = now + Math.floor(Math.random() * 86400 * 7); // В течение недели
            const end = begin + Math.floor(Math.random() * 86400 * 3) + 3600; // От 1 часа до 3 дней
            const status = statusTypes[Math.floor(Math.random() * statusTypes.length)];
            
            status_schedule.push({
                begin: Math.floor(begin/1000),
                end: Math.floor(end/1000),
                status: status
            });
        }
    }
    
    // Генерация capabilities (возможности)
    const allCapabilities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Различные возможности EVSE
    const capabilities = [];
    const numCapabilities = Math.floor(Math.random() * 5) + 1; // От 1 до 5 возможностей
    
    for (let i = 0; i < numCapabilities; i++) {
        const capability = allCapabilities[Math.floor(Math.random() * allCapabilities.length)];
        if (!capabilities.includes(capability)) {
            capabilities.push(capability);
        }
    }
    
  
    // Генерация parking_restrictions (ограничения парковки)
    const allParkingRestrictions = [1, 2, 3, 4, 5]; // Различные ограничения
    const parking_restrictions = [];
    const numRestrictions = Math.floor(Math.random() * 4); // От 0 до 3 ограничений
    
    for (let i = 0; i < numRestrictions; i++) {
        const restriction = allParkingRestrictions[Math.floor(Math.random() * allParkingRestrictions.length)];
        if (!parking_restrictions.includes(restriction)) {
            parking_restrictions.push(restriction);
        }
    }
    
    // Генерация floor_level (уровень этажа)
    const floor_level = Math.floor(Math.random() * 10) - 5; // От -5 до 4 (подземные и надземные этажи)
    
    return {
        status_schedule: status_schedule,
        capabilities: capabilities,
        coordinates: {
            latitude: ethers.parseEther(coordinates.latitude),
            longitude: ethers.parseEther(coordinates.longitude)
        },
        parking_restrictions: parking_restrictions,
        floor_level: floor_level
    };
}
