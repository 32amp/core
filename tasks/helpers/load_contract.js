const { loadConfig } = require("./configs")
const { accountSelection, partnerSelection } = require("./promt_selection");


// Helper function to initialize the Balance contract
async function loadContract(contract,hre, signer = null, partner_id = null) {
    const config = await loadConfig("config");
    
    if (typeof config?.deployed?.Hub === "undefined") {
        throw new Error("Hub not deployed");
    }
    
    if(signer == null)
        signer = await accountSelection(hre);
    
    const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);

    if(partner_id == null)
        partner_id = await partnerSelection();

    const exist = await hub.getModule(contract, partner_id);

    if (exist === hre.ethers.ZeroAddress) {
        throw new Error(`Module ${contract} does not exist for partner_id ${partner_id}`);
    }

    const instance = await hre.ethers.getContractAt(contract, exist, signer);

    return {instance, partner_id, signer }
}


module.exports.loadContract = loadContract;