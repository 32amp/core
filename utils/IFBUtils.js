var CryptoJS = require("crypto-js");

module.exports.ConvertContractResponseStructToNormalObject = function(schemeObjRef, contractResponseStruct) {
    const target = Object.assign({}, schemeObjRef);
    let i = 0;
    for(let key in schemeObjRef) {
        target[key] = contractResponseStruct[i];
        i++;
    }

    return target;
};

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

module.exports.GetEventArgumentsByNameAsync = async function(transaction, eventName) {
    const result = await transaction.wait();
    
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