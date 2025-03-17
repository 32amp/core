const MobileAppSettingsScope = scope("MobileAppSettings", "Tasks for MobileAppSettings module");
const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");
const fileTypes = [
    "None", "JSON", "HTML", "PDF", "CSV", "XLSX", "XLS",
    "DOC", "DOCX", "JPG", "PNG", "GIF", "SVG"
];


MobileAppSettingsScope.task("version", "Get the version of the MobileAppSettings contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: mobileAppSettings } = await loadContract("MobileAppSettings",hre);
        const version = await mobileAppSettings.getVersion();
        console.log(`Version: ${version}`);
    });

// Task to upgrade of the MobileAppSettings contract
MobileAppSettingsScope.task("upgrade", "Upgrade of the MobileAppSettings contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: mobileAppSettings } = await loadContract("MobileAppSettings", hre);

        try {
            const contractFactory = await ethers.getContractFactory("MobileAppSettings")
            const deploy = await upgrades.upgradeProxy(mobileAppSettings.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }
        
    });

MobileAppSettingsScope.task("set-config", "Set the configuration for MobileAppSettings")
    .setAction(async (taskArgs, hre) => {
        const { instance: mobileAppSettings } = await loadContract("MobileAppSettings",hre);

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
        const { instance: mobileAppSettings } = await loadContract("MobileAppSettings",hre);
        const tx = await mobileAppSettings.setTechnicalWork(taskArgs.status);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log("Technical work status set successfully");
    });

MobileAppSettingsScope.task("get-config", "Get the current configuration of MobileAppSettings")
    .setAction(async (taskArgs, hre) => {
        const { instance: mobileAppSettings } = await loadContract("MobileAppSettings",hre);
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