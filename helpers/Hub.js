const {hex2string} = require("../utils/utils");

const Roles = [
    "None",
    "CPO",
    "EMSP",
    "HUB",
    "NSP",
    "SCSP"
]

const ConnectionStatus = [
    "None",
    "CONNECTED",
    "OFFLINE",
    "PLANNED",
    "SUSPENDED"
]


const DataTypes = {

    ConnectorTypes: {
        None: 0,
        Type1: 1,
        Type2: 2,
        Chademo: 3,
        CCS1: 4,
        CCS2: 5,
        GBTDC: 6,
        GBTAC: 7,
        DOMESTIC_A: 8,
        DOMESTIC_B: 9,
        DOMESTIC_C: 10,
        DOMESTIC_D: 11,
        DOMESTIC_E: 12,
        DOMESTIC_F: 13,
        DOMESTIC_G: 14,
        DOMESTIC_H: 15,
        DOMESTIC_I: 16,
        DOMESTIC_J: 17,
        DOMESTIC_K: 18,
        DOMESTIC_L: 19,
        DOMESTIC_M: 20,
        DOMESTIC_N: 21,
        DOMESTIC_O: 22,
        IEC_60309_2_single_16: 23,
        IEC_60309_2_three_16: 24,
        IEC_60309_2_three_32: 25,
        IEC_60309_2_three_64: 26,
        IEC_62196_T3A: 27,
        NEMA_5_20: 28,
        NEMA_6_30: 29,
        NEMA_6_50: 30,
        NEMA_10_30: 31,
        NEMA_10_50: 32,
        NEMA_14_30: 33,
        NEMA_14_50: 34,
        PANTOGRAPH_BOTTOM_UP: 35,
        PANTOGRAPH_TOP_DOWN: 36,
        TSL: 37
    },
    ConnectorErrors: {
        None: 0,
        ConnectorLockFailure: 1,
        EVCommunicationError: 2,
        GroundFailure: 3,
        HighTemperature: 4,
        InternalError: 5,
        LocalListConflict: 6,
        NoError: 7,
        OtherError: 8,
        OverCurrentFailure: 9,
        PowerMeterFailure: 10,
        PowerSwitchFailure: 11,
        ReaderFailure: 12,
        ResetFailure: 13,
        UnderVoltage: 14,
        OverVoltage: 15,
        WeakSignal: 16,
        PowerModuleFailure: 17,
        EmergencyButtonPressed: 18,
    },

    ConnectorFormat: {
        None: 0,
        Socket: 1,
        Cable: 2
    },

    PowerType: {
        None: 0,
        AC_1_PHASE: 1,
        AC_2_PHASE: 2,
        AC_2_PHASE_SPLIT: 3,
        AC_3_PHASE: 4,
        DC: 5
    },

    EVSEStatus: {
        None: 0,
        Available: 1,
        Unavailable: 2,
        Planned: 3,
        Removed: 4,
        Blocked: 5,
        Maintenance: 6
    },
    Capabilities: {
        ChargingProfileCapable: 0,
        ChargingPreferencesCapable: 1,
        ChipCardSupport: 2,
        ContactlessCardSupport: 3,
        CreditCardPayable: 4,
        DebitCardPayable: 5,
        PedTerminal: 6,
        RemoteStartStopCapable: 7,
        Reservable: 8,
        RfidReader: 9,
        StartSessionConnectorRequired: 10,
        TokenGroupCapable: 11,
        UnlockCapable: 12
    },
    ParkingRestriction: {
        None: 0,
        EvOnly: 1,
        Plugged: 2,
        Disabled: 3,
        Customers: 4,
        Motorcycles: 5
    },
    ImageCategory: {
        None: 0,
        Charger: 1,
        Entrance: 2,
        Location: 3,
        Network: 4,
        Operator: 5,
        Other: 6,
        Owner: 7
    },
    ImageType: {
        None: 0,
        JPG: 1,
        PNG: 2,
        GIF: 3,
        SVG: 4
    },
    ParkingType: {
        None: 0,
        AlongMotorway: 1,
        ParkingGarage: 2,
        ParkingLot: 3,
        OnDriveway: 4,
        OnStreet: 5,
        UndergroundGarage: 6,
    },
    FileType: {
        None: 0,
        JSON: 1,
        HTML: 2,
        PDF: 3,
        CSV: 4,
        XLSX: 5,
        XLS: 6,
        DOC: 7,
        DOCX: 8,
        JPG: 9,
        PNG: 10,
        GIF: 11,
        SVG: 12,
    },
    ConnectorStatus: {
        None: 0,
        Available: 1,
        Preparing: 2,
        Charging: 3,
        SuspendedEVSE: 4,
        SuspendedEV: 5,
        Finishing: 6,
        Reserved: 7,
        Unavailable: 8,
        Faulted: 9
    },
    EnergySourceCategory: {
        None: 0,
        NUCLEAR: 1,
        GENERAL_FOSSIL: 2,
        COAL: 3,
        GAS: 4,
        GENERAL_GREEN: 5,
        SOLAR: 6,
        WIND: 7,
        WATER: 8,
    },
    EnvironmentalImpactCategory: {
        None: 0,
        NUCLEAR_WASTE: 1,
        CARBON_DIOXIDE: 2,
    },
    Facility: {
        None: 0,
        Hotel: 1,
        Restaurant: 2,
        Cafe: 3,
        Mall: 4,
        Supermarket: 5,
        Sport: 6,
        RecreationArea: 7,
        Nature: 8,
        Museum: 9,
        BikeSharing: 10,
        BusStop: 11,
        TaxiStand: 12,
        TramStop: 13,
        MetroStation: 14,
        TrainStation: 15,
        Airport: 16,
        ParkingLot: 17,
        CarpoolParking: 18,
        FuelStation: 19,
        Wifi: 20,
    },
    DayOfWeek: {
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
        SUNDAY: 7,
    },
    TariffDimensionType: {
        ENERGY: 0,
        FLAT: 1,
        PARKING_TIME: 2,
        TIME: 3,
    },
    ReservationRestrictionType: {
        None: 0,
        RESERVATION: 1,
        RESERVATION_EXPIRES: 2,
    },
};



const formatPartner = function(partner) {

    
    let roles = []

    if(partner.role.length)
        for (let index = 0; index < partner.role.length; index++) {
            const role = partner.role[index];
            roles.push(Roles[role])
        }

    return {
        id:partner.id,
        country_code:hex2string(partner.country_code),
        party_id:hex2string(partner.party_id),
        name:hex2string(partner.name),
        role:roles,
        status:ConnectionStatus[partner.status],
        owner_address:partner.owner_address,
        last_updated: partner.last_updated
    }

}

const formatPartners = function(partners) {

    let result = []


    for (let index = 0; index < partners.length; index++) {
        const partner = partners[index];
        result.push(formatPartner(partner))
    }

    return result;
}


module.exports.ConnectionStatus = ConnectionStatus;
module.exports.Roles = Roles;
module.exports.formatPartner = formatPartner;
module.exports.formatPartners = formatPartners;
module.exports.DataTypes = DataTypes;