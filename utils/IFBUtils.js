var CryptoJS = require("crypto-js");

module.exports.GenerateRandomAddress = function() {
    const ethers = require("ethers");  
    const crypto = require("crypto");

    const id = crypto.randomBytes(32).toString("hex");
    const privateKey = "0x"+id;
    //console.log("SAVE BUT DO NOT SHARE THIS:", privateKey);

    const wallet = new ethers.Wallet(privateKey);
    //console.log("Address: " + wallet.address)

    return {
        privateKey: privateKey,
        publicKey: wallet.address
    }
}

module.exports.GetEventArgumentsByNameAsync = async function(transaction, eventName, wait ) {
    const result = await transaction.wait(wait);
    
    for (let index = 0; index < result.logs.length; index++) {
        const event = result.logs[index];
        if(event.fragment?.name == eventName){
            //console.log("EVENT: "+ eventName, event.args )
            return event.args
        } 
    }

    return false;
}

module.exports.createpayload = function(initData){
    
    let array = []
    
    initData.sort()

    for (const [key, value] of initData.entries()) {
        if(key != "hash")
            array.push(`${key}=${value}`)
    }

    return array.join("\n")
}

module.exports.verifyTelegramWebAppData = function(TELEGRAM_BOT_TOKEN,telegramInitData){
    const initData = new URLSearchParams(telegramInitData);
    const payload = createpayload(initData)
    const hash = initData.get("hash");
    const secret_key = CryptoJS.HmacSHA256(TELEGRAM_BOT_TOKEN, "WebAppData");
    const calculated_hash = CryptoJS.HmacSHA256(payload, secret_key).toString();
    return calculated_hash === hash;
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