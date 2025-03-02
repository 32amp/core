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