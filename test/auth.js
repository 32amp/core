
const { expect } = require('chai');


const {GetEventArgumentsByNameAsync, createpayload} = require("../utils/IFBUtils");
const {deploy} = require("./lib/deploy");

before(async function() {
    const tgtoken = "6421082813:AAHEX0kUk18YM3yhwecw37Pbfo6hnVTvAno";
    const accounts = await ethers.getSigners();
    this.owner = accounts[0].address

    this.sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }

    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true})


    this.testUser = {
        login: ethers.encodeBytes32String("darkrain"),
        password: ethers.encodeBytes32String("159753"),
    }

})


describe("Auth", function(){

    it("authSudoUser", async function(){
        let auth = await this.contracts.Auth.authByPassword(this.sudoUser.login,this.sudoUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.contracts.Auth.getAuthTokenByPassword(this.sudoUser.login,this.sudoUser.password, authSuccess.token_id)

        this.sudoUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("registerByPassword", async function(){
        let register = await this.contracts.Auth.registerByPassword(this.testUser.login,this.testUser.password)
        await register.wait()

        let auth = await this.contracts.Auth.authByPassword(this.testUser.login,this.testUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.contracts.Auth.getAuthTokenByPassword(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })



    it("isLogin", async function(){
        const isLogin =  await this.contracts.Auth.isLogin(this.testUser.token);

        expect(Number(isLogin)).to.equal(2)
    })

    it("setTestUserByPhone", async function(){
        await this.contracts.Auth.setTestUserByPhone(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"));
    })

    it("sendSmsForAuth, authBySmsCode", async function(){

        await this.contracts.Auth.sendSmsForAuth(ethers.encodeBytes32String("+79999999998"))

        let auth = await this.contracts.Auth.authBySmsCode(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.contracts.Auth.getAuthTokenBySMS(ethers.encodeBytes32String("+79999999998"),ethers.encodeBytes32String("8888"), authSuccess.token_id)

        this.testUser.tokensms = token[1];        

        expect(token[1].length).to.equal(66)
    })



    it("setTestEmailByPhone", async function(){
        await this.contracts.Auth.setTestUserByEmail(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"));
    })

    it("sendEmailForAuth, authByEmailCode", async function(){

        await this.contracts.Auth.sendEmailForAuth(ethers.encodeBytes32String("test@example.com"))

        let auth = await this.contracts.Auth.authByEmailCode(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.contracts.Auth.getAuthTokenByEmail(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"), authSuccess.token_id)

        this.testUser.tokenemail = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("authByTg", async function (){
        const user_token = "user=%7B%22id%22%3A14097%2C%22first_name%22%3A%22Artem%22%2C%22last_name%22%3A%22Timofeev%22%2C%22username%22%3A%22timas%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-237986505224524480&chat_type=channel&auth_date=1718456760&hash=92ec5dcf30d621ad100042109975eff18dfbe403a525158a4d1b5dedb9f059af";


        const initData = new URLSearchParams(user_token);
        
        const payload = createpayload(initData)
        
        
        const user_data = JSON.parse(initData.get("user")); 

        const web_app_data = {
            id: user_data.id,
            first_name: ethers.encodeBytes32String(user_data.first_name),
            last_name:ethers.encodeBytes32String(user_data.last_name),
            language_code:ethers.encodeBytes32String(user_data.language_code),
        }
        
        let auth = await this.contracts.Auth.authByTg(ethers.toUtf8Bytes(payload), "0x"+initData.get("hash"), web_app_data)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.contracts.Auth.getAuthTokenByTG(ethers.toUtf8Bytes(payload), "0x"+initData.get("hash"), web_app_data, authSuccess.token_id)

        this.testUser.tokentg = token[1];    

        expect(token[1].length).to.equal(66)
    })

    it("authByTgV2", async function (){
        const user = {"id":555536511,"first_name":"Mihail","last_name":"Ivantsov","username":"progerlab","photo_url":"https://t.me/i/userpic/320/Ap2yHfkoR10a15E4BPijonJaREc9xWPs_wHn2siMEkM.jpg","auth_date":1732112828,"hash":"7bdc3db59949faeb42cfd8a0f212efca72ad18b639d33c98f85181999d6b7af9"};

        const createpayloadv2 = function(initData){
    
            let array = []
            
            const ordered = Object.keys(initData).sort().reduce(
                (obj, key) => { 
                  obj[key] = initData[key]; 
                  return obj;
                }, 
                {}
            );

            for (const key in ordered) {
                if (Object.hasOwnProperty.call(ordered, key)) {
                    const value = ordered[key];
                    if(key != "hash")
                        array.push(`${key}=${value}`)
                }
            }

            return array.join("\n")
        }
        
        const payload = createpayloadv2(user)
        
        
        const web_app_data = {
            id: user.id,
            first_name: ethers.encodeBytes32String(user.first_name),
            last_name:ethers.encodeBytes32String(user.last_name),
            language_code:ethers.encodeBytes32String(""),
        }
        
        let auth = await this.contracts.Auth.authByTgV2(ethers.toUtf8Bytes(payload), "0x"+user.hash, web_app_data)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.contracts.Auth.getAuthTokenByTGV2(ethers.toUtf8Bytes(payload), "0x"+user.hash, web_app_data, authSuccess.token_id)

        this.testUser.tokentg2 = token[1];    

        expect(token[1].length).to.equal(66)
    })

})
