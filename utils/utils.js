var CryptoJS = require("crypto-js");

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
        
        points.push({ lat, lng });
    }
    
    return points;
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
        `${capital} Central Station: 8x 150kW, 24/7`,
        `Tech Park ${capital}: 4x 350kW, RFID access`,
        `${capital} Mall North: 6 stalls, free 2h`,
        `Airport ${capital}: EV priority zone`,
        `${capital} City Hall: 2x 22kW AC`,
        `Highway A1 ${capital}: 4x CCS/Chademo`,
        `IKEA ${capital}: 50kW while shopping`,
        `${capital} University: Staff only`,
        `Marina ${capital}: Solar-powered 11kW`,
        `Hospital ${capital}: 3x fast chargers`,
        `Outlet Village ${capital}: 8 stalls`,
        `${capital} Zoo: 4x 50kW, pay per kWh`,
        `Stadium ${capital}: Game days only`,
        `Business District ${capital}: 6x 150kW`,
        `Park ${capital} West: 2x AC overnight`,
        `Hotel Grand ${capital}: Valet charging`,
        `Police HQ ${capital}: Secure station`,
        `${capital} Convention Center: 10 stalls`,
        `Taxi Rank ${capital}: Priority charging`,
        `Cineplex ${capital}: Charge while movie`,
        `Museum ${capital}: 4x 22kW included`,
        `Rest Stop ${capital} East: 24/7`,
        `University ${capital}: 6x AC outlets`,
        `Golf Club ${capital}: Member only`,
        `Ski Resort ${capital}: Winter season`,
        `Camping ${capital}: 3x slow chargers`,
        `Ferry Terminal ${capital}: 2x 50kW`,
        `Library ${capital}: Free while reading`,
        `Factory Outlet ${capital}: 4 stalls`,
        `Municipal ${capital}: Pay per minute`
    ];
  
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return randomTemplate.slice(0, maxLength);
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
    return randomTemplate.slice(0, maxLength);
  }