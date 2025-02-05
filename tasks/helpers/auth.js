module.exports.authByPassword = async function(login,password){
    const { loadContracts} = require("./load_contract")
    const {GetEventArgumentsByNameAsync} = require("../../utils/IFBUtils");
    const {Auth} = await loadContracts(["Auth"])

    var token;
    try {
        let auth = await Auth.authByPassword(ethers.encodeBytes32String(login),ethers.encodeBytes32String(password))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")
    
        token = await Auth.getAuthTokenByPassword(ethers.encodeBytes32String(login),ethers.encodeBytes32String(password), authSuccess.token_id)
    
    } catch (error) {
        console.log("ERROR GET TOKEN",error)
        return
    }

    return token[1]
}