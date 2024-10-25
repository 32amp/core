module.exports.config = {
    "SMSService": {
        "sendTimeout": 60n,
        "priceForMessage": 1n,
        "whitelistEnable": false,
        "bodyTemplate": "[message]"
    },
    "EmailService": {
        "sendTimeout": 60n,
        "priceForMessage": 1n,
        "whitelistEnable": false,
        "bodyTemplate": "[message]"
    }
}