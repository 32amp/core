const {deployProxy} = require("../../utils/deploy")
const {GetEventArgumentsByNameAsync} = require("../../utils/IFBUtils");

module.exports.auth = async function(Auth){

    const testUser = {
        login: ethers.encodeBytes32String("darkrain"),
        password: ethers.encodeBytes32String("159753"),
    }

    const sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }

    let register = await Auth.registerByPassword(testUser.login,testUser.password)
    await register.wait()

    let auth = await Auth.authByPassword(testUser.login,testUser.password)
    let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

    let token = await Auth.getAuthTokenByPassword(testUser.login,testUser.password, authSuccess.token_id)

    testUser.token = token[1];       
    


    await Auth.setTestUserByPhone(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"));
    
    await Auth.sendSmsForAuth(ethers.encodeBytes32String("+79999999998"))

    let auth2 = await Auth.authBySmsCode(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"))
    let authSuccess2 = await GetEventArgumentsByNameAsync(auth2, "CreateAuthToken")

    let token2 = await Auth.getAuthTokenBySMS(ethers.encodeBytes32String("+79999999998"),ethers.encodeBytes32String("8888"), authSuccess2.token_id)

    testUser.tokensms = token2[1];    


    let auth3 = await Auth.authByPassword(sudoUser.login,sudoUser.password)
    let authSuccess3 = await GetEventArgumentsByNameAsync(auth3, "CreateAuthToken")

    let token3 = await Auth.getAuthTokenByPassword(sudoUser.login,sudoUser.password, authSuccess3.token_id)

    sudoUser.token = token3[1];      

    return {testUser, sudoUser}
}