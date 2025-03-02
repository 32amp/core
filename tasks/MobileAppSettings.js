const MobileAppSettingsScope = scope("MobileAppSettings", "Tasks for MobileAppSettings module");
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const { loadConfig } = require("./helpers/configs")
const inquirer = require("inquirer");
const fileTypes = [
    "None", "JSON", "HTML", "PDF", "CSV", "XLSX", "XLS",
    "DOC", "DOCX", "JPG", "PNG", "GIF", "SVG"
];

// Helper function to initialize the MobileAppSettings contract
async function getMobileAppSettingsContract(hre) {
    const config = await loadConfig("config");
    if (typeof config?.deployed?.Hub === "undefined") {
        throw new Error("Hub not deployed");
    }
    const signer = await accountSelection(hre);
    const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);
    const partner_id = await partnerSelection();
    const exist = await hub.getModule("MobileAppSettings", partner_id);
    if (exist === hre.ethers.ZeroAddress) {
        throw new Error(`Module MobileAppSettings does not exist for partner_id ${partner_id}`);
    }
    const mobileAppSettings = await hre.ethers.getContractAt("MobileAppSettings", exist, signer);
    return { mobileAppSettings, partner_id, signer };
}


MobileAppSettingsScope.task("version", "Get the version of the MobileAppSettings contract")
    .setAction(async (taskArgs, hre) => {
        const { mobileAppSettings } = await getMobileAppSettingsContract(hre);
        const version = await mobileAppSettings.getVersion();
        console.log(`Version: ${version}`);
    });

MobileAppSettingsScope.task("set-config", "Set the configuration for MobileAppSettings")
    .setAction(async (taskArgs, hre) => {
        const { mobileAppSettings } = await getMobileAppSettingsContract(hre);

        const questions = [
            {
                type: "input",
                name: "privacy_policy_name",
                message: "Enter privacy policy file name:"
            },
            {
                type: "input",
                name: "privacy_policy_cid",
                message: "Enter privacy policy IPFS CID:"
            },
            {
                type: "list",
                name: "privacy_policy_type",
                message: "Select privacy policy file type:",
                choices: fileTypes
            },
            {
                type: "input",
                name: "license_agreement_name",
                message: "Enter license agreement file name:"
            },
            {
                type: "input",
                name: "license_agreement_cid",
                message: "Enter license agreement IPFS CID:"
            },
            {
                type: "list",
                name: "license_agreement_type",
                message: "Select license agreement file type:",
                choices: fileTypes
            },
            {
                type: "confirm",
                name: "technical_work",
                message: "Is technical work enabled?"
            },
            {
                type: "input",
                name: "support_phone",
                message: "Enter support phone number:"
            }
        ];

        const answers = await inquirer.prompt(questions);

        const privacyPolicyTypeIndex = fileTypes.indexOf(answers.privacy_policy_type);
        const licenseAgreementTypeIndex = fileTypes.indexOf(answers.license_agreement_type);

        const config = {
            privacy_policy: {
                name_file: answers.privacy_policy_name,
                ipfs_cid: answers.privacy_policy_cid,
                file_type: privacyPolicyTypeIndex
            },
            license_agreement: {
                name_file: answers.license_agreement_name,
                ipfs_cid: answers.license_agreement_cid,
                file_type: licenseAgreementTypeIndex
            },
            technical_work: answers.technical_work,
            support_phone: answers.support_phone
        };

        
        const tx = await mobileAppSettings.setConfig(config);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log("Config set successfully");
    });

MobileAppSettingsScope.task("set-technical-work", "Set the technical work status")
    .addParam("status", "Technical work status (true/false)", undefined, types.boolean)
    .setAction(async (taskArgs, hre) => {
        const { mobileAppSettings } = await getMobileAppSettingsContract(hre);
        const tx = await mobileAppSettings.setTechnicalWork(taskArgs.status);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log("Technical work status set successfully");
    });

MobileAppSettingsScope.task("get-config", "Get the current configuration of MobileAppSettings")
    .setAction(async (taskArgs, hre) => {
        const { mobileAppSettings } = await getMobileAppSettingsContract(hre);
        const config = await mobileAppSettings.getConfig();
        console.log("Current Configuration:");
        console.log("Privacy Policy:");
        console.log(`  Name: ${config.privacy_policy.name_file}`);
        console.log(`  IPFS CID: ${config.privacy_policy.ipfs_cid}`);
        console.log(`  File Type: ${fileTypes[config.privacy_policy.file_type]}`);
        console.log("License Agreement:");
        console.log(`  Name: ${config.license_agreement.name_file}`);
        console.log(`  IPFS CID: ${config.license_agreement.ipfs_cid}`);
        console.log(`  File Type: ${fileTypes[config.license_agreement.file_type]}`);
        console.log(`Technical Work: ${config.technical_work}`);
        console.log(`Support Phone: ${config.support_phone}`);
    });