const { expect } = require('chai');


const {GetEventArgumentsByNameAsync, createpayload} = require("../utils/IFBUtils");
const {deploy} = require("./lib/deploy");

before(async function() {
    const tgtoken = "6421082813:AAHEX0kUk18YM3yhwecw37Pbfo6hnVTvAno";
    
    this.sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }

    this.contracts = await deploy(tgtoken,this.sudoUser,{
        User: true,
        MobileApp: true,
        Auth: true,
        UserGroups: true,
        Tariff: true,
        Location: true,
        LocationSearch: true,
        EVSE: true,
        Connector: true,
        UserSupportChat: true,
    })


    this.testUser = {
        login: ethers.encodeBytes32String("darkrain"),
        password: ethers.encodeBytes32String("159753"),
    }

})


describe("Hub", function(){


    it("getMe", async function(){
        const me = await this.contracts.Hub.me();

        expect(me.owner_address).to.equal(this.owner)
    })


    it("getPartnerByAddress", async function(){
        const me = await this.contracts.Hub.getPartnerByAddress(this.owner);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerIdByAddress", async function(){
        const id = await this.contracts.Hub.getPartnerIdByAddress(this.owner);

        expect(1).to.equal(id)
    })


    it("getPartner", async function(){
        const me = await this.contracts.Hub.getPartner(1);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerModules", async function(){
        const modules = await this.contracts.Hub.getPartnerModules(1);

        expect(modules[0]).to.equal("RevertCodes")
        expect(modules[1]).to.equal("MobileApp  ")
        expect(modules[1]).to.equal("User")
        expect(modules[2]).to.equal("Auth")
        expect(modules[3]).to.equal("UserGroups")
        expect(modules[4]).to.equal("Tariff")
        expect(modules[5]).to.equal("Location")
        expect(modules[6]).to.equal("LocationSearch")
        expect(modules[7]).to.equal("EVSE")
        expect(modules[8]).to.equal("Connector")
        expect(modules[9]).to.equal("UserSupportChat")
        expect(modules[10]).to.equal("UserAccess")
        //
    })


    it("getPartners", async function(){
        const partners = await this.contracts.Hub.getPartners()

        expect(partners.length).to.equal(1)
    })

    it("changeModuleAddress", async function(){
        await this.contracts.Hub.changeModuleAddress("User", this.contracts.Hub.target)

        let moduleAdress = await this.contracts.Hub.getModule("User", 1)

        expect(moduleAdress).to.equal(this.contracts.Hub.target)

        let tx = await this.contracts.Hub.changeModuleAddress("User", this.contracts.User.target)

        await tx.wait()
        let moduleAdressBack = await this.contracts.Hub.getModule("User", 1)
        expect(moduleAdressBack).to.equal(this.contracts.User.target)
    })

    it("checkModuleExist", async function(){
        let checkOne = await this.contracts.Hub.checkModuleExist("User", 1)

        expect(checkOne).to.equal(this.contracts.User.target)

    })

    it("getPartnerByAddress", async function(){
        let partner = await this.contracts.Hub.getPartnerByAddress(this.owner);

        expect(partner.id).to.equal(1n)
    })

    it("getPartnerIdByAddress", async function(){
        let partner = await this.contracts.Hub.getPartnerIdByAddress(this.owner)
        expect(partner).to.equal(1n)
    })

    it("getPartnerName", async function(){
        let name = await this.contracts.Hub.getPartnerName(1n)

        expect(name).to.equal(ethers.encodeBytes32String("PortalEnergy"))
    })

    it("getPartnerPartyId", async function(){
        let partyId = await this.contracts.Hub.getPartnerPartyId(1n)

        expect(partyId).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
    })

    it("getPartnerCountryCode", async function(){
        let code = await this.contracts.Hub.getPartnerCountryCode(1n)
        
        expect(code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
    })
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
        console.log("payload",payload)
        
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
        
        console.log("payload",payload)
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




/* describe("MobileApp", function(){
    it("setLogo", async function(){
        const logobase64 = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTgiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCAyNTggNDIiIGZpbGw9Im5vbmUiPgogIDxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xNTI4XzMpIj4KICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzYuOTgzNCAyLjI5NTQxSDU4LjkxNDNDNjYuNTczOCA0LjQ1MTI0IDY0LjU4ODYgMTQuNDIzOSA1OC44Njc0IDE1LjA3NTNINDAuNjU2OFYyMi4wNzAySDM2Ljk2NzhWMi4yOTU0MUgzNi45ODM0WiIgZmlsbD0iIzEwMTQyNiIgc3Ryb2tlPSIjMTAxNDI2IiBzdHJva2Utd2lkdGg9IjAuMjE2IiBzdHJva2UtbWl0ZXJsaW1pdD0iMjIuOTI1NiI+PC9wYXRoPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00MC44MTM1IDYuMDk1MjFINTcuOTkyNEM2MC41MDkxIDcuMTE4ODUgNjAuNzU5MiA5Ljg2NDA1IDU3Ljk5MjQgMTEuMjc1NEg0MC44MTM1VjYuMDk1MjFaIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMTAxNDI2IiBzdHJva2Utd2lkdGg9IjAuMjE2IiBzdHJva2UtbWl0ZXJsaW1pdD0iMjIuOTI1NiI+PC9wYXRoPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMDYuMzI1IDIuMjk1NDVIMTI5LjMzNUMxMzQuNzEyIDMuMDI0NCAxMzYuNzEzIDEyLjI5OTEgMTI5Ljc4OCAxNS4yMzA1TDEzNS4xNjUgMjIuMjI1M0gxMzAuMjU3TDEyNC44MDIgMTUuNjgwMkgxMTAuMTU1VjIyLjIyNTNIMTA2LjMyNVYyLjI5NTQ1WiIgZmlsbD0iIzEwMTQyNiIgc3Ryb2tlPSIjMTAxNDI2IiBzdHJva2Utd2lkdGg9IjAuMjE2IiBzdHJva2UtbWl0ZXJsaW1pdD0iMjIuOTI1NiI+PC9wYXRoPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMTAuMTU1IDYuMDk1MzNIMTI3Ljg4MUMxMjkuODA0IDYuNTQ1MTEgMTMxLjMyIDkuOTcyNzMgMTI3Ljg4MSAxMS40NDYxSDExMC4xNTVWNi4wOTUzM1oiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMxMDE0MjYiIHN0cm9rZS13aWR0aD0iMC4yMTYiIHN0cm9rZS1taXRlcmxpbWl0PSIyMi45MjU2Ij48L3BhdGg+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEzOS40NDggMi40NTA0OUgxNjQuNzcxVjUuOTU1NjZIMTUzLjg3NlYyMi4wODU2SDE1MC4zNDRWNS45NTU2NkgxMzkuNDQ4VjIuNDUwNDlaIiBmaWxsPSIjMTAxNDI2IiBzdHJva2U9IiMxMDE0MjYiIHN0cm9rZS13aWR0aD0iMC4yMTYiIHN0cm9rZS1taXRlcmxpbWl0PSIyMi45MjU2Ij48L3BhdGg+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2OS42NzkgMjIuMjQwN0gxNzMuNTA5VjE0LjYyNTRIMTkyLjUzM1YyMi4yNDA3SDE5Ni4zNjJWOS4xNTA1NUMxOTUuNTE4IDUuNjc2NCAxOTMuNzY4IDMuMTAxODEgMTg5IDIuMTU1NzJIMTc3LjE4M0MxNzMuNjE5IDIuMzcyODYgMTcwLjI3MyA1LjYyOTg3IDE2OS42NjQgOS4xNTA1NVYyMi4yNDA3SDE2OS42NzlaIiBmaWxsPSIjMTAxNDI2IiBzdHJva2U9IiMxMDE0MjYiIHN0cm9rZS13aWR0aD0iMC4yMTYiIHN0cm9rZS1taXRlcmxpbWl0PSIyMi45MjU2Ij48L3BhdGg+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE3My41MDkgMTAuODI1N0gxOTIuNTMzQzE5Mi40ODYgNi45NzkzNCAxODkuNTYzIDYuMTg4MzUgMTg4LjY1NiA2LjE4ODM1SDE3Ny40MTdDMTc2LjA3MyA2LjE4ODM1IDE3My42OTcgNy41NTMxOSAxNzMuNTA5IDEwLjgyNTdaIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMTAxNDI2IiBzdHJva2Utd2lkdGg9IjAuMjE2IiBzdHJva2UtbWl0ZXJsaW1pdD0iMjIuOTI1NiI+PC9wYXRoPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMjYuOTA2IDE4LjQ0MDlIMjA5LjU1NUMyMDcuMTMyIDE4LjM0NzkgMjA1LjY3OSAxNi45MzY1IDIwNS40MTMgMTQuMzYxOUwyMDUuMTE2IDIuMjk1NDVIMjAxLjEzVjE0LjkzNThDMjAxLjI1NSAxOS40ODAxIDIwNC4xOTQgMjEuNjgyNCAyMDcuNzI2IDIyLjI0MDhIMjI2LjkwNlYxOC40NDA5WiIgZmlsbD0iIzEwMTQyNiIgc3Ryb2tlPSIjMTAxNDI2IiBzdHJva2Utd2lkdGg9IjAuMjE2IiBzdHJva2UtbWl0ZXJsaW1pdD0iMjIuOTI1NiI+PC9wYXRoPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02OS40NjU4IDQxLjg2MDRWMzMuNjg2OEg3NS41NjIxVjM1LjA2NzJINzEuMTIyOFYzNi44ODE4SDc1LjI0OTVWMzguMjYyMkg3MS4xMjI4VjQwLjQ4SDc1LjcxODRWNDEuODYwNEg2OS40NjU4Wk05MS4zMDMgNDEuODYwNFYzMy42ODY4SDkyLjkyODdMOTYuMzA1IDM5LjE0NjJWMzMuNjg2OEg5Ny44NTI2VjQxLjg2MDRIOTYuMThMOTIuODUwNSAzNi41MjUxVjQxLjg0NDlIOTEuMzAzVjQxLjg2MDRaTTExMy43NjUgNDEuODYwNFYzMy42ODY4SDExOS44NjJWMzUuMDY3MkgxMTUuNDIyVjM2Ljg4MThIMTE5LjU0OVYzOC4yNjIySDExNS40MjJWNDAuNDhIMTIwLjAxOFY0MS44NjA0SDExMy43NjVaTTEzNS41ODcgNDEuODYwNFYzMy42ODY4SDEzOS4wODhDMTM5Ljk2NCAzMy42ODY4IDE0MC42MDUgMzMuNzY0NCAxNDEuMDExIDMzLjkwNEMxNDEuNDE3IDM0LjA0MzUgMTQxLjczIDM0LjMwNzIgMTQxLjk2NSAzNC42Nzk0QzE0Mi4xOTkgMzUuMDUxNyAxNDIuMzI0IDM1LjQ4NTkgMTQyLjMyNCAzNS45NjY3QzE0Mi4zMjQgMzYuNTcxNiAxNDIuMTM3IDM3LjA4MzQgMTQxLjc3NyAzNy40ODY3QzE0MS40MTcgMzcuODg5OSAxNDAuODcgMzguMTM4MSAxNDAuMTUxIDM4LjI0NjZDMTQwLjUxMSAzOC40NDgzIDE0MC44MDggMzguNjgwOSAxNDEuMDQyIDM4LjkyOTFDMTQxLjI3NyAzOS4xNzcyIDE0MS41ODkgMzkuNjI3IDE0MS45OCA0MC4yNDc0TDE0Mi45ODEgNDEuODQ0OUgxNDAuOTk1TDEzOS43OTIgNDAuMDYxM0MxMzkuMzcgMzkuNDI1NCAxMzkuMDczIDM5LjAyMjEgMTM4LjkxNiAzOC44NjdDMTM4Ljc2IDM4LjY5NjQgMTM4LjU4OCAzOC41ODc5IDEzOC40MTYgMzguNTI1OEMxMzguMjQ0IDM4LjQ2MzggMTM3Ljk2MyAzOC40MzI4IDEzNy41NzIgMzguNDMyOEgxMzcuMjQ0VjQxLjg0NDlIMTM1LjU4N1Y0MS44NjA0Wk0xMzcuMjU5IDM3LjE0NTVIMTM4LjQ5NEMxMzkuMjkyIDM3LjE0NTUgMTM5Ljc5MiAzNy4xMTQ0IDEzOS45OTUgMzcuMDUyNEMxNDAuMTk4IDM2Ljk5MDQgMTQwLjM1NSAzNi44NjYzIDE0MC40NjQgMzYuNzExMkMxNDAuNTczIDM2LjU0MDYgMTQwLjYzNiAzNi4zMzkgMTQwLjYzNiAzNi4xMDYzQzE0MC42MzYgMzUuODI3MSAxNDAuNTU4IDM1LjYxIDE0MC40MTcgMzUuNDM5NEMxNDAuMjc2IDM1LjI2ODggMTQwLjA1OCAzNS4xNjAyIDEzOS43OTIgMzUuMTEzN0MxMzkuNjUxIDM1LjA5ODIgMTM5LjI2IDM1LjA4MjcgMTM4LjU3MyAzNS4wODI3SDEzNy4yNzVWMzcuMTQ1NUgxMzcuMjU5Wk0xNjEuODc5IDM4Ljg1MTVWMzcuNDcxMkgxNjUuNDU5VjQwLjcyODJDMTY1LjExNSA0MS4wNjk0IDE2NC41OTkgNDEuMzY0MSAxNjMuOTQyIDQxLjYxMjJDMTYzLjI4NiA0MS44NjA0IDE2Mi42MTQgNDIgMTYxLjk0MiA0MkMxNjEuMDgyIDQyIDE2MC4zMzIgNDEuODEzOSAxNTkuNjkxIDQxLjQ1NzFDMTU5LjA1IDQxLjEwMDQgMTU4LjU2NSA0MC41ODg2IDE1OC4yNTMgMzkuOTIxN0MxNTcuOTI0IDM5LjI1NDggMTU3Ljc2OCAzOC41MjU4IDE1Ny43NjggMzcuNzUwM0MxNTcuNzY4IDM2Ljg5NzMgMTU3Ljk1NiAzNi4xMzczIDE1OC4yOTkgMzUuNDg1OUMxNTguNjU5IDM0LjgxOSAxNTkuMTkgMzQuMzIyNyAxNTkuODc4IDMzLjk2NkMxNjAuNDEgMzMuNjg2OCAxNjEuMDY2IDMzLjU2MjcgMTYxLjg0OCAzMy41NjI3QzE2Mi44NjQgMzMuNTYyNyAxNjMuNjc3IDMzLjc3OTkgMTY0LjIzOSAzNC4xOTg2QzE2NC44MTggMzQuNjE3NCAxNjUuMTc3IDM1LjIwNjggMTY1LjM0OSAzNS45NjY3TDE2My42OTIgMzYuMjc2OUMxNjMuNTgzIDM1Ljg3MzcgMTYzLjM2NCAzNS41NjM1IDE2My4wMzYgMzUuMzMwOEMxNjIuNzIzIDM1LjA5ODIgMTYyLjMxNyAzNC45ODk2IDE2MS44MzIgMzQuOTg5NkMxNjEuMTEzIDM0Ljk4OTYgMTYwLjUzNSAzNS4yMjIzIDE2MC4wOTcgMzUuNjcyMUMxNTkuNjc1IDM2LjEzNzMgMTU5LjQ1NiAzNi44MDQzIDE1OS40NTYgMzcuNzAzOEMxNTkuNDU2IDM4LjY2NTQgMTU5LjY3NSAzOS4zOTQ0IDE2MC4xMTMgMzkuODkwN0MxNjAuNTUgNDAuMzcxNSAxNjEuMTEzIDQwLjYxOTYgMTYxLjgxNyA0MC42MTk2QzE2Mi4xNiA0MC42MTk2IDE2Mi41MiA0MC41NTc2IDE2Mi44NjQgNDAuNDE4QzE2My4yMDggNDAuMjc4NCAxNjMuNTIgNDAuMTIzMyAxNjMuNzcgMzkuOTIxN1YzOC44ODI1SDE2MS44NzlWMzguODUxNVpNMTgzLjMyNSA0MS44NjA0VjM4LjQxNzNMMTgwLjMwOSAzMy42ODY4SDE4Mi4yNjJMMTg0LjIwMSAzNi45MTI4TDE4Ni4wOTIgMzMuNjg2OEgxODguMDE1TDE4NC45ODIgMzguNDMyOFY0MS44NjA0SDE4My4zMjVaIiBmaWxsPSIjMTAxNDI2Ij48L3BhdGg+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTk5LjEzNDggNi4wOTUzM0MxMDAuNzc2IDcuMTE4OTYgMTAxLjgyMyA4Ljk4MDExIDEwMi4wMTEgMTEuODAyOUwxMDIuMDQyIDE4LjI4NTlDMTAxLjY5OCAyMS45NjE3IDk5LjM2OTMgMjQuNjkxMyA5NS44MjA5IDI1LjI4MDdINzYuODZDNzMuNTE0OCAyNC41NTE4IDcwLjczMjQgMjEuNjk4IDcwLjczMjQgMTguNjczNkM3MC43MzI0IDE4LjY3MzYgNzEuOTM2IDE5LjgzNjggNzMuMzExNiAyMC4wODVMOTIuODgyMiAyMC4xMTZDOTUuMjQyNiAxOS44NTIzIDk4LjMzNzYgMTguNDU2NSA5OS4xMzQ4IDEzLjkyNzdDOTkuMjEzIDEzLjQ5MzQgOTkuMTE5MiA2LjA5NTMzIDk5LjEzNDggNi4wOTUzM1oiIGZpbGw9IiMwMEMyRkYiPjwvcGF0aD4KICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOTIuODgxOSAyMC4xMTU5Qzk2LjQ2MTUgMTkuOTQ1MyA5OC4xMzQxIDE2LjgxMjQgOTguMTM0MSAxNi44MTI0Qzk4LjAwOTEgMTkuMDYxMyA5Ny4xODA2IDIwLjc2NzMgOTQuMzUxMyAyMS4yMDE2SDc4LjIwNEM3Ny40NjkzIDIxLjA5MyA3Ni41MTU4IDIwLjY1ODggNzYuMDkzOCAyMC4xMzE0TDkyLjg4MTkgMjAuMTE1OVoiIGZpbGw9IndoaXRlIj48L3BhdGg+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTczLjc0OTMgMC4wMTU0NDk1SDkyLjc4ODRDOTYuOTYyIDAuMjE3MDc0IDk4Ljg2OSAzLjY5MTIzIDk5LjE4MTcgNi42MjI1NEM5OS4xODE3IDYuNjIyNTQgOTkuMjEyOSAxMi42MDkyIDk5LjIxMjkgMTMuMTA1NkM5OS4xODE3IDE1LjgxOTcgOTcuMzA1OSAxOS42OTcxIDkyLjg5NzggMjAuMTAwNEg3My40MzY2QzcwLjM4ODUgMTkuNjE5NiA2Ny45NSAxNS40MTY1IDY3LjgyNSAxMy4xMzY2QzY3LjgyNSAxMy4xMDU2IDY3LjgyNSA2LjcxNTYgNjcuODI1IDYuNzE1NkM2Ny45ODEzIDQuMDAxNDIgNzAuODU3NSAwLjI2MzYwMyA3My43NDkzIDAuMDE1NDQ5NVoiIGZpbGw9IiMxMDE0MjYiIHN0cm9rZT0iIzEwMTQyNiIgc3Ryb2tlLXdpZHRoPSIwLjIxNiIgc3Ryb2tlLW1pdGVybGltaXQ9IjIyLjkyNTYiPjwvcGF0aD4KICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNzUuMzc0NyAzLjgzMDk0TDkyLjA1MzUgMy44MTU0M0M5My4yNTcxIDMuOTM5NTEgOTQuNjAxNCA1LjAyNTE4IDk1LjE2NDEgNi43OTMyN0M5NS4yNDIzIDcuMDI1OTIgOTUuMzA0OCAxMi4wNTEgOTUuMDA3OCAxMy4wMjgxQzk0LjYxNyAxNC4yODQ0IDkzLjgzNTUgMTUuNTQwNyA5Mi4wNjkxIDE1Ljk5MDVINzUuMzkwM0M3My42Mzk2IDE1Ljc0MjMgNzIuNDk4NSAxNC40ODYgNzIuMDI5NSAxMi42NDA0QzcxLjg3MzIgMTEuOTg5IDcxLjkwNDUgNy42NDYzIDcyLjA2MDggNy4wNDE0M0M3Mi40OTg1IDUuMjg4ODQgNzMuNzMzNCAzLjk4NjA0IDc1LjM3NDcgMy44MzA5NFoiIGZpbGw9IndoaXRlIj48L3BhdGg+CiAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTk0LjMyMDggNS4xOTU4SDc3LjcyMDJDNzQuOTA2NSA1LjQ1OTQ2IDcyLjU0NjEgNy40NzU3MSA3MS45MzY1IDguNzk0MDNMNzEuOTY3OCAxMi4xMTMxQzcyLjE1NTQgMTMuOTU4NyA3My4xNTU4IDE1LjE2ODUgNzQuNjg3NyAxNS44MzU0TDc0Ljc2NTggMTIuNjA5NEM3NC45MjIxIDEwLjE3NDQgNzYuNzY2NiA5LjA4ODcxIDc4Ljg0NTYgOS4wMTExNkw5NS4yMTE3IDkuMDczMkM5NS4yMTE3IDkuMDczMiA5NS4yMTE3IDcuNDYwMiA5NS4xNjQ4IDYuOTYzOUM5NS4xMTggNi4zOTAwNCA5NC42MzM0IDUuNDU5NDYgOTQuMzIwOCA1LjE5NThaIiBmaWxsPSIjMDBDMkZGIj48L3BhdGg+CiAgPC9nPgogIDxwYXRoIGQ9Ik0xMjguNTY5IDI5Ljk5NTVDMTk5LjU2NyAyOS45OTU1IDI1Ny4xMjIgMjkuMDQ0MiAyNTcuMTIyIDI3Ljg3MDdDMjU3LjEyMiAyNi42OTcyIDE5OS41NjcgMjUuNzQ1OSAxMjguNTY5IDI1Ljc0NTlDNTcuNTcwOCAyNS43NDU5IDAuMDE1NjI1IDI2LjY5NzIgMC4wMTU2MjUgMjcuODcwN0MwLjAxNTYyNSAyOS4wNDQyIDU3LjU3MDggMjkuOTk1NSAxMjguNTY5IDI5Ljk5NTVaIiBmaWxsPSIjMTAxNDI2Ij48L3BhdGg+CiAgPGRlZnM+CiAgICA8Y2xpcFBhdGggaWQ9ImNsaXAwXzE1MjhfMyI+CiAgICAgIDxyZWN0IHdpZHRoPSIyNTcuMTIyIiBoZWlnaHQ9IjQyIiBmaWxsPSJ3aGl0ZSI+PC9yZWN0PgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+Cjwvc3ZnPgo=`
        this.contracts.MobileApp.setLogo(this.sudoUser.token, logobase64)
    })
}) */


describe("User", function(){



    it("whoami", async function(){
        const whoami =  await this.contracts.User.whoami(this.testUser.token);

        expect(whoami.enable).to.equal(true);
        expect(whoami.user_type).to.equal(0);
        expect(whoami.last_updated).not.to.equal(0);

        expect(whoami.username.toString() == this.testUser.login).to.equal(true)
    })


    it("addCar, getCars, removeCar", async function(){
        let tx = await this.contracts.User.addCar(this.testUser.token,0,{
            brand:"Tesla",
            model:"Model 3",
            connectors: [1,2]
        })

        await tx.wait()

        const cars = await this.contracts.User.getCars(this.testUser.token, 0)

        expect(cars[0].brand).to.equal("Tesla")

        let tx2 = await this.contracts.User.removeCar(this.testUser.token, 0,0)

        await tx2.wait()

        const cars_zero = await this.contracts.User.getCars(this.testUser.token,0)

        expect(cars_zero.length).to.equal(0)
    })

    it("updateBaseData", async function(){
        let tx1 = await this.contracts.User.updateBaseData(this.testUser.tokensms, 0, ethers.encodeBytes32String("Pavel"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))
        await tx1.wait()
        let whoami =  await this.contracts.User.whoami(this.testUser.tokensms);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Pavel").toString())

        let tx2 = await this.contracts.User.updateBaseData(this.sudoUser.token, whoami.id, ethers.encodeBytes32String("Nikolay"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))
        await tx2.wait()

        whoami = await this.contracts.User.whoami(this.testUser.tokensms);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Nikolay").toString())
    })

    it("updateCompanyInfo", async function(){
        await this.contracts.User.updateCompanyInfo(this.testUser.token, 0, {
            name: "Portal",
            description: "Wow",
            inn:1212,
            kpp: 121212,
            ogrn: 8767,
            bank_account: 1212121,
            bank_name: "SuperBank",
            bank_bik: 3232234234,
            bank_corr_account: 66543,
            bank_inn: 51442456,
            bank_kpp_account: 787878
        })

        let info = await this.contracts.User.getCompanyInfo(this.testUser.token, 0)
        
        expect(info.name).to.equal("Portal")
    })

})


describe("UserSupportChat", function (){

    const messages = [
        { text: "Здравствуйте! Что вы знаете о Ленине?", who: "user" },
        { text: "Здравствуйте! Ленин был основателем Советского государства.", who: "admin" },
        { text: "Какие его выступления были наиболее значительными?", who: "user" },
        { text: "Одним из самых известных является 'Что делать?'", who: "admin" },
        { text: "А о чем он там говорит?", who: "user" },
        { text: "'Что делать?' обсуждает необходимость партийной организации.", who: "admin" },
        { text: "Какова была его роль в Октябрьской революции?", who: "user" },
        { text: "Он был лидером большевиков и сыграл ключевую роль в революции.", who: "admin" },
        { text: "Интересно! А каковы основные идеи Ленина?", who: "user" },
        { text: "Основные идеи включают социализм и диктатуру пролетариата.", who: "admin" },
        { text: "А что он говорил о международной революции?", who: "user" },
        { text: "Он считал, что революция должна быть международной для успеха.", who: "admin" },
        { text: "Каковы его взгляды на империализм?", who: "user" },
        { text: "Ленин считал империализм высшей стадией капитализма.", who: "admin" },
        { text: "Какие у него были отношения с другими социалистами?", who: "user" },
        { text: "Он часто конфликтовал с меньшевиками.", who: "admin" },
        { text: "Почему он так не любил меньшевиков?", who: "user" },
        { text: "Он считал их слишком осторожными и медлительными.", who: "admin" },
        { text: "Как он относился к крестьянству?", who: "user" },
        { text: "Ленин видел крестьян как союзников пролетариата.", who: "admin" },
        { text: "А что насчет NEP?", who: "user" },
        { text: "НЭП был политикой экономической реконструкции после гражданской войны.", who: "admin" },
        { text: "Почему он ввел НЭП?", who: "user" },
        { text: "Он считал, что это необходимо для восстановления экономики.", who: "admin" },
        { text: "Каковы были последствия НЭП?", who: "user" },
        { text: "НЭП способствовал экономическому росту, но также вызвал критику.", who: "admin" },
        { text: "Кто был его ближайшим соратником?", who: "user" },
        { text: "Одним из его соратников был Троцкий.", who: "admin" },
        { text: "Каковы были разногласия между ними?", who: "user" },
        { text: "Они расходились во мнениях по поводу стратегии революции.", who: "admin" },
        { text: "Что произошло после смерти Ленина?", who: "user" },
        { text: "После его смерти началась борьба за власть между различными лидерами.", who: "admin" },
        { text: "Кто стал его преемником?", who: "user" },
        { text: "Сталин постепенно стал доминирующей фигурой.", who: "admin" },
        { text: "Как Ленин воспринимал Сталина?", who: "user" },
        { text: "Он предостерегал от слишком большой власти Сталина в своем завещании.", who: "admin" },
        { text: "Что еще было в его завещании?", who: "user" },
        { text: "Он рекомендовал создать коллективное руководство.", who: "admin" },
        { text: "Каковы были взгляды Ленина на культуру?", who: "user" },
        { text: "Он считал, что культура должна служить социалистическим целям.", who: "admin" },
        { text: "Какова была его позиция по отношению к религии?", who: "user" },
        { text: "Ленин был атеистом и критиковал религию как опиум народа.", who: "admin" },
        { text: "Как он относился к искусству?", who: "user" },
        { text: "Он поддерживал искусство, которое пропагандировало социализм.", who: "admin" },
        { text: "Какие у него были взгляды на образование?", who: "user" },
        { text: "Ленин считал образование ключевым для развития общества.", who: "admin" },
        { text: "Каковы его достижения в области образования?", who: "user" },
        { text: "Были созданы новые школы и университеты, доступные для всех.", who: "admin" },
    ];
    


    it("createTopic", async function(){
        const tx = await this.contracts.UserSupportChat.createTopic(this.testUser.token, messages[0].text, 1 )

        let createTopicSuccess = await GetEventArgumentsByNameAsync(tx, "CreateTopic")

        expect(createTopicSuccess.topic_id).to.equal(0)
        expect(createTopicSuccess.theme).to.equal(1)
    })


    it("getTopic", async function(){
        const topic = await this.contracts.UserSupportChat.getTopic(this.testUser.token, 0);

        expect(topic.create_user_id).to.equal(2)
        expect(topic.message_counter).to.equal(1)
        expect(topic.theme).to.equal(1)
        expect(topic.closed).to.equal(false)
    })

    it("getMyTopics", async function(){
        const topics = await this.contracts.UserSupportChat.getMyTopics(this.testUser.token, 0)

        expect(topics[0].create_user_id).to.equal(2)
        expect(topics[0].message_counter).to.equal(1)
        expect(topics[0].theme).to.equal(1)
        expect(topics[0].closed).to.equal(false)
        
    })

    it("ChatEmitation", async function(){
        for (let index = 1; index < messages.length; index++) {
            const message = messages[index];

            var tx;
            
            if(message.who == "user"){
                tx = await this.contracts.UserSupportChat.sendMessage(this.testUser.token, 0, {text:message.text, reply_to:0,image:ethers.toUtf8Bytes("")})

            }else{
                tx = await this.contracts.UserSupportChat.sendMessage(this.sudoUser.token, 0, {text:message.text, reply_to:0,image:ethers.toUtf8Bytes("")})
            }

            let sendMessageSuccess = await GetEventArgumentsByNameAsync(tx, "Message")

            await new Promise(r => setTimeout(r, 2000));

            expect(sendMessageSuccess.topic_id).to.equal(0)
            expect(sendMessageSuccess.message_id).to.equal(index)
        }
    })


    it("getMessages", async function(){
        const topicMessages = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 0);

        for (let index = 0; index < 10; index++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessages[index].text)
        }

        const topicMessagesOffset = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 10);

        for (let index = 10, i =0; index < 20; index++, i++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessagesOffset[i].text)
        }


        const topicMessagesOffset2 = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 40);

        for (let index = 40, i =0; index < 20; index++, i++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessagesOffset2[i].text)
        }

    })

    it("setRating", async function(){
        await this.contracts.UserSupportChat.setRating(this.testUser.token, 0,5)

        const topic = await this.contracts.UserSupportChat.getTopic(this.testUser.token,0);

        expect(topic.user_rating).to.equal(5)
    })


    it("setReadedMessages", async function(){
        var readed = []
        for (let index = 0; index < messages.length; index++) {
            const element = messages[index];

            if(element.who == "admin"){
                readed.push(index)
            }
            
        }

        await this.contracts.UserSupportChat.setReadedMessages(this.testUser.token,0, readed)


        const topicMessages = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 0);

        expect(topicMessages[readed[0]].readed).to.equal(true);
    })


    it("closeTopic", async function(){
        let tx = await this.contracts.UserSupportChat.closeTopic(this.testUser.token, 0);
        let closeTopicSuccess = await GetEventArgumentsByNameAsync(tx, "CloseTopic")

        expect(closeTopicSuccess.topic_id).to.equal(0);
        expect(closeTopicSuccess.user_id).to.equal(2);


        const topic = await this.contracts.UserSupportChat.getTopic(this.testUser.token, 0);

        expect(topic.closed).to.equal(true);
    })
})





describe("UserAccess", function(){
    it("sudo getMyModulesAccess", async function(){

        const accesModules =  await this.contracts.UserAccess.getMyModulesAccess(this.sudoUser.token);
    
        expect(accesModules[1][0]).to.equal(6)
        expect(accesModules[1][1]).to.equal(6)
    })

    it("sudo getModuleAccessLevel", async function(){

        const accessToGroup =  await this.contracts.UserAccess.getModuleAccessLevel("UserGroups", 1);
        expect(accessToGroup).to.equal(6)
    })

    it("setAccessLevelToModule", async function(){
        const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"User", 6);
        tx.wait()

        const result = await this.contracts.UserAccess.getModuleAccessLevel("User",2)

        expect(result).to.equal(6);
    })
})



describe("UserGroups", function(){
    it("getMyGroups", async function(){
        
        const myGroups =  await this.contracts.UserGroups.getMyGroups(this.sudoUser.token);
        expect(myGroups.length).to.equal(1)
        expect(myGroups[0].name).to.equal("sudo")
    })

    it("addGroup", async function(){
        await this.contracts.UserGroups.addGroup(this.sudoUser.token, "test");
        const myGroups =  await this.contracts.UserGroups.getMyGroups(this.sudoUser.token);
        expect(myGroups.length).to.equal(2)
        
    });
})


describe("Tariff", function(){
    const free_tariff = {
        currency: 1,
        _type: 1,
        tariff_alt_text: [{
            language: "ru",
            text: "Описание тарифа"
        }],
        tariff_alt_url: "",
        elements: [
            {
                price_components: [
                    {
                        _type: 1,
                        price: 0,
                        vat:0,
                        step_size:0
                    }
                ],
                restrictions: {
                    start_unixtime:0,
                    end_unixtime:0,
                    min_kwh:0,
                    max_kwh:0,
                    min_current:0,
                    max_current:0,
                    min_power:0,
                    max_power:0,
                    min_duration:0,
                    max_duration:0,
                    day_of_week:[0],
                    reservation:0
                }
            }
        ]
    }

    const energy_mix = {
        is_green_energy: true,
        energy_sources: [{
            source: 1,
            percentage:10,
        }],
        environ_impact: [{
            category: 1,
            amount:10
        }],
        supplier_name: "test",
        energy_product_name: "test"
    }

    it("addDefaultFreeTariff", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Tariff", 4);
        const tx =  await this.contracts.Tariff.add(this.testUser.token, free_tariff);
        let result = await GetEventArgumentsByNameAsync(tx, "AddTariff")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })


    it("setMinPrice", async function(){
        let tx = await this.contracts.Tariff.setMinPrice(this.testUser.token, 1, {
            excl_vat:10,
            incl_vat:12
        })

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.min_price.excl_vat).to.equal(10)
    })

    it("setMaxPrice", async function(){
        let tx = await this.contracts.Tariff.setMaxPrice(this.testUser.token, 1, {
            excl_vat:10,
            incl_vat:12
        })

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.max_price.excl_vat).to.equal(10)
    })

    it("setStartDateTime", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.setStartDateTime(this.testUser.token, 1, time)
        
        await tx.wait()
        
        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.start_date_time).to.equal(time)
    })

    it("setEndDateTime", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.setEndDateTime(this.testUser.token, 1, time)

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.end_date_time).to.equal(time)
    })

    it("setEnergyMix", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.setEnergyMix(this.testUser.token, 1, energy_mix)
        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.energy_mix.is_green_energy).to.equal(true)
    })

    it("get", async function(){
        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.last_updated).not.to.be.equal(0)
        expect(tariff.country_code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
        expect(tariff.party_id).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
       
    })


})

describe("Locations", function(){
    const location = {
        name: "New location",
        _address: "Dom kolotuskina",
        city:  ethers.encodeBytes32String("Moskow"),
        postal_code: ethers.encodeBytes32String("103892"),
        state: ethers.encodeBytes32String("Moskow"),
        country: ethers.encodeBytes32String("RUS"),
        coordinates: {
            latitude: "59.694982",
            longtitude: "30.416469"
        },
        parking_type: 5,
        facilities: [1,2], // Hotel, Restaurant
        time_zone : "Moskow/Europe",
        charging_when_closed: true,
        publish: true
    };

    const image = {
        url: "https://upload.wikimedia.org/wikipedia/ru/thumb/e/e8/BORAT%21.jpg/201px-BORAT%21.jpg",
        thumbnail_ipfs: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
        category: 3,
        _type: 1,
        width: 100,
        height: 100
    };

    const relatedLocation = {
        latitude: ethers.parseEther("59.694982"),
        longtitude: ethers.parseEther("30.416469"),
        name: [{
            language: "ru",
            text: "Кафе"
        }]
    };

    const openingTimes = {
        twentyfourseven: true,
        regular_hours:[
            {
                week_day:1,
                period_begin:"7:00",
                period_end:"21:00"
            }
        ],
        exceptional_openings:[
            {
                begin:7,
                end:21
            }
        ],
        exceptional_closings:[
            {
                begin:7,
                end:21
            }
        ],
    }

    const direction = {
        language: "ru",
        text: "Заезд с улицы колотушкина, возле волшебного дуба"        
    }

    it("AddLocation", async function(){

        await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Location", 4);

        const tx =  await this.contracts.Location.addLocation(this.testUser.token, location);

        let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })

    it("addRelatedLocation", async function(){

        await this.contracts.Location.addRelatedLocation(this.testUser.token, 1, relatedLocation);

    })

    it("addImage", async function(){
        await this.contracts.Location.addImage(this.testUser.token, 1, image);
    })

    it("addDirection", async function(){
        await this.contracts.Location.addDirection(this.testUser.token, 1, direction);
    })


    it("setOpeningTimes", async function(){
        await this.contracts.Location.setOpeningTimes(this.testUser.token, 1, openingTimes);
    })

    it("getLocation", async function(){

        
        const newLocation = await this.contracts.Location.getLocation(1);
        
        expect(newLocation.location.uid).to.equal(1)
        expect(newLocation.location.city).to.equal(location.city)
        expect(newLocation.location.postal_code).to.equal(location.postal_code)
        expect(newLocation.location.state).to.equal(location.state)
        expect(newLocation.location.country).to.equal(location.country)

        expect(newLocation.location.coordinates.latitude).to.equal(ethers.parseEther(location.coordinates.latitude))
        expect(newLocation.location.coordinates.longtitude).to.equal(ethers.parseEther(location.coordinates.longtitude))
        expect(newLocation.location.parking_type).to.equal(location.parking_type)
        expect(newLocation.location.facilities.join(",")).to.equal(location.facilities.join(","))
        expect(newLocation.location.time_zone).to.equal(location.time_zone)
        expect(newLocation.location.charging_when_closed).to.equal(location.charging_when_closed)
        // relatedlocation
        expect(newLocation.related_locations[0].latitude).to.equal(relatedLocation.latitude)
        expect(newLocation.related_locations[0].longtitude).to.equal(relatedLocation.longtitude)
        expect(newLocation.related_locations[0].name[0].language).to.equal(relatedLocation.name[0].language)
        expect(newLocation.related_locations[0].name[0].text).to.equal(relatedLocation.name[0].text)
        //image
        expect(newLocation.images[0].url).to.equal(image.url)
        expect(newLocation.images[0].thumbnail).to.equal(image.thumbnail)
        expect(newLocation.images[0].category).to.equal(image.category)
        expect(newLocation.images[0]._type).to.equal(image._type)
        expect(newLocation.images[0].width).to.equal(image.width)
        expect(newLocation.images[0].height).to.equal(image.height)

        //OpeningTimes
        expect(newLocation.opening_times.twentyfourseven).to.equal(openingTimes.twentyfourseven)
        expect(newLocation.opening_times.regular_hours.week_day).to.equal(openingTimes.regular_hours.week_day)
        expect(newLocation.opening_times.regular_hours.period_begin).to.equal(openingTimes.regular_hours.period_begin)
        expect(newLocation.opening_times.regular_hours.period_end).to.equal(openingTimes.regular_hours.period_end)
        expect(newLocation.opening_times.exceptional_openings.begin).to.equal(openingTimes.exceptional_openings.begin)
        expect(newLocation.opening_times.exceptional_openings.end).to.equal(openingTimes.exceptional_openings.end)
        expect(newLocation.opening_times.exceptional_closings.begin).to.equal(openingTimes.exceptional_closings.begin)
        expect(newLocation.opening_times.exceptional_closings.end).to.equal(openingTimes.exceptional_closings.end)

        // Direction
        expect(newLocation.directions[0].language).to.equal(direction.language)
        expect(newLocation.directions[0].text).to.equal(direction.text)

    })


    it("removeRelatedLocation", async function(){
        await this.contracts.Location.removeRelatedLocation(this.testUser.token, 1, 1); 
        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation.related_locations.length).to.equal(0)
    })

    it("removeImage", async function(){
        await this.contracts.Location.removeImage(this.testUser.token, 1, 1); 
        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation.images.length).to.equal(0)
    })

    it("removeDirection", async function(){
        await this.contracts.Location.removeDirection(this.testUser.token, 1, 1); 
        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation.directions.length).to.equal(0)
    })


/*     it("addlocations", async function(){
        const fs = require('fs');
        const coords = JSON.parse( fs.readFileSync(__dirname+"/../coords.json", 'utf8'))

        for (let index = 0; index < coords.length; index++) {
            const coord = coords[index];
            const loc = location;
            loc.coordinates.latitude = coord.lat;
            loc.coordinates.longtitude =coord.lon;

            let tx = await this.contracts.Location.addLocation(this.testUser.token, loc);

            let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")


            let newLocation = await this.contracts.Location.getLocation(Number(result.uid));
            expect(newLocation[0].coordinates.latitude).to.equal(ethers.parseEther(loc.coordinates.latitude))
            expect(newLocation[0].coordinates.longtitude).to.equal(ethers.parseEther(loc.coordinates.longtitude))

        }
    }) */

})



describe("EVSE", function(){
    const {EVSE, EVSEmeta, image} = getEVSEData();

    it("add", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"EVSE", 4);
        
        const tx =  await this.contracts.EVSE.add(this.testUser.token, EVSE, 1);

        let result = await GetEventArgumentsByNameAsync(tx, "AddEVSE")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)

    })

    it("setMeta", async function(){
        await this.contracts.EVSE.setMeta(this.testUser.token, 1, EVSEmeta)
    })

    it("addImage", async function(){
        await this.contracts.EVSE.addImage(this.testUser.token, 1, image);
    })

    it("get", async function(){
        const evse = await this.contracts.EVSE.get(1)

        expect(evse.evse.evse_id).to.equal(EVSE.evse_id)
        expect(evse.evse.evse_model).to.equal(EVSE.evse_model)
        expect(evse.evse.physical_reference).to.equal(EVSE.physical_reference)
        expect(evse.evse.directions.language).to.equal(EVSE.directions.language)
        expect(evse.evse.directions.text).to.equal(EVSE.directions.text)

        expect(evse.meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(evse.meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(evse.meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(evse.meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(evse.meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(evse.meta.coordinates.longtitude).to.equal(EVSEmeta.coordinates.longtitude)
        expect(evse.meta.parking_restrictions[0]).to.equal(EVSEmeta.parking_restrictions[0])
        expect(evse.meta.floor_level).to.equal(EVSEmeta.floor_level)


        expect(evse.images[0].url).to.equal(image.url)
        expect(evse.images[0].thumbnail).to.equal(image.thumbnail)
        expect(evse.images[0].category).to.equal(image.category)
        expect(evse.images[0]._type).to.equal(image._type)
        expect(evse.images[0].width).to.equal(image.width)
        expect(evse.images[0].height).to.equal(image.height)

    })



    it("removeImage", async function(){
        await this.contracts.EVSE.removeImage(this.testUser.token, 1, 1); 
        const evse = await this.contracts.EVSE.get(1);
        expect(evse.images.length).to.equal(0)
    })
})

describe("Connector", function(){
    const {connector} = getEVSEData();

    it("add", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Connector", 4);

        const tx =  await this.contracts.Connector.add(this.testUser.token, connector, 1);

        let result = await GetEventArgumentsByNameAsync(tx, "AddConnector")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })
})


/* describe("LocationSearch", function(){


    it("inArea all kirov zavod", async function(){

        const locations = await this.contracts.LocationSearch.inArea({publish: true, topRightLat:"59.883143",topRightLong:"30.270558",bottomLeftLat:"59.870363",bottomLeftLong:"30.247867", offset:0, connectors:[1], onlyFreeConnectors:true})
        expect(locations[0].length).to.equal(2)
    })

    it("inArea all saint petersburg", async function(){

        // all saint petersburg
        const locations = await this.contracts.LocationSearch.inArea({publish: true, topRightLat:"60.133835",topRightLong:"30.933217",bottomLeftLat:"59.630048",bottomLeftLong:"29.649831", offset:0, connectors:[1], onlyFreeConnectors:true})

        expect(locations[0].length).to.equal(50)
    })


    it("inArea all saint petersburg with offset", async function(){

        // all saint petersburg
        const locations = await this.contracts.LocationSearch.inArea({publish: true, topRightLat:"60.133835",topRightLong:"30.933217",bottomLeftLat:"59.630048",bottomLeftLong:"29.649831", offset:50, connectors:[1], onlyFreeConnectors:true})

        expect(locations[0].length).to.equal(24)
    })



    it("inAreaMany", async function(){

        let locations_1 = await this.contracts.LocationSearch.inArea({publish: true, topRightLat:"66.537305",topRightLong:"177.814396",bottomLeftLat:"43.146425",bottomLeftLong:"11.585331",offset:0, connectors:[1], onlyFreeConnectors:true})
        expect(locations_1[1]).to.equal(1135n)

    })

    it("inAreaMany with offset", async function(){

        let locations_1 = await this.contracts.LocationSearch.inArea({publish: true, topRightLat:"66.537305",topRightLong:"177.814396",bottomLeftLat:"43.146425",bottomLeftLong:"11.585331",offset:50, connectors:[1], onlyFreeConnectors:true})
        expect(locations_1[0].length).to.equal(50)

    })

}) */


describe("Location: check after all", function(){

    it("getlocation", async function(){
        const {EVSE, EVSEmeta, image, connector} = getEVSEData();
        //await this.contracts.Location.addEVSE(this.testUser.token, 1, 1);
        const loc = await this.contracts.Location.getLocation(1);

        expect(loc.evses[0].evse.evse_id).to.equal(EVSE.evse_id)
        expect(loc.evses[0].evse.evse_model).to.equal(EVSE.evse_model)
        expect(loc.evses[0].evse.physical_reference).to.equal(EVSE.physical_reference)
        expect(loc.evses[0].evse.directions.language).to.equal(EVSE.directions.language)
        expect(loc.evses[0].evse.directions.text).to.equal(EVSE.directions.text)

        expect(loc.evses[0].meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(loc.evses[0].meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(loc.evses[0].meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(loc.evses[0].meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(loc.evses[0].meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(loc.evses[0].meta.coordinates.longtitude).to.equal(EVSEmeta.coordinates.longtitude)
        expect(loc.evses[0].meta.parking_restrictions[0]).to.equal(EVSEmeta.parking_restrictions[0])
        expect(loc.evses[0].meta.floor_level).to.equal(EVSEmeta.floor_level)


        expect(loc.evses[0].connectors[0].connector.standard).to.equal(connector.standard)
        expect(loc.evses[0].connectors[0].connector.format).to.equal(connector.format)
        expect(loc.evses[0].connectors[0].connector.power_type).to.equal(connector.power_type)
        expect(loc.evses[0].connectors[0].connector.max_voltage).to.equal(connector.max_voltage)
        expect(loc.evses[0].connectors[0].connector.max_amperage).to.equal(connector.max_amperage)
        expect(loc.evses[0].connectors[0].connector.max_electric_power).to.equal(connector.max_electric_power)
        expect(loc.evses[0].connectors[0].connector.terms_and_conditions_url).to.equal(connector.terms_and_conditions_url)
        expect(loc.evses[0].connectors[0].status).to.equal(0)

    })

    it("removeEVSE", async function(){
        await this.contracts.Location.removeEVSE(this.testUser.token, 1, 1); 
        
        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation[4].length).to.equal(0)
    })

})


function getEVSEData(){
    const EVSE = {
        evse_id: "ufo0001",
        evse_model: 1,
        physical_reference: ethers.encodeBytes32String("Под номером 10"),
        directions: [
            {
                language: "ru",
                text: "Возле пожарного выхода",
            }
        ]
    }

    const EVSEmeta = {
        status_schedule: [
            {
                begin: 123123123, // timestamp
                end:123123123, // timestamp
                status: 6 // maintance
            }
        ],
        capabilities: [1,2,3],
        coordinates: {
            latitude: ethers.parseEther("59.694982"),
            longtitude: ethers.parseEther("30.416469")
        },
        parking_restrictions: [0,2,3],
        floor_level:1
    }

    const image = {
        url: "https://wikimedia.org/",
        thumbnail_ipfs: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
        category: 3,
        _type: 1,
        width: 100,
        height: 100
    };
    const connector = {
        standard: 1,
        format:2,
        power_type: 1,
        max_voltage: 220,
        max_amperage: 32,
        max_electric_power: 7,
        terms_and_conditions_url: "https://portalenergy.tech"
    }
    return {EVSE,EVSEmeta,image,connector}
}