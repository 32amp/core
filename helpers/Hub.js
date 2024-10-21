const {hex2string} = require("../utils/IFBUtils");

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
