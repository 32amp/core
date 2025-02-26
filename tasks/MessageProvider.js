const messageProviderScope = scope("MessageProvider", "Tasks for MessageOracle service");


const fs = require("fs");

// Task to deploy and initialize the MessageProvider contract
messageProviderScope.task("deploy", "Deploy and initialize the MessageProvider contract")
  .addParam("settings", "Path to JSON file with initial service settings")
  .setAction(async (taskArgs, hre) => {
    var settingsData = JSON.parse(fs.readFileSync(taskArgs.settings, "utf8"));

    settingsData.min_provider_deposit = hre.ethers.parseEther(settingsData.min_provider_deposit);
    settingsData.min_cost_per_message = hre.ethers.parseEther(settingsData.min_cost_per_message);
    settingsData.service_fee = hre.ethers.parseEther(settingsData.service_fee);
    settingsData.punishment_coast = hre.ethers.parseEther(settingsData.punishment_coast);
    
    const MessageProvider = await hre.ethers.getContractFactory("MessageProvider");
    const messageProvider = await hre.upgrades.deployProxy(MessageProvider, [settingsData], {
      initializer: "initialize",
    });
    await messageProvider.waitForDeployment();
    console.log("MessageProvider deployed to:", messageProvider.target);
    return messageProvider.address;
  });

// Task to register a new provider
messageProviderScope.task("registerProvider", "Register a new provider")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("providerJson", "Path to JSON file with provider configuration")
  .addParam("deposit", "Amount to deposit (in eth)")
  .addParam("account", "Address of the provider account")
  .setAction(async (taskArgs, hre) => {
    const providerData = JSON.parse(fs.readFileSync(taskArgs.providerJson, "utf8"));
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const tx = await messageProvider.connect(signer).registerProvider(providerData, {
      value: hre.ethers.parseEther(taskArgs.deposit),
    });
    await tx.wait();
    console.log("Provider registered by:", taskArgs.account);
  });

// Task to request a handshake with a provider
messageProviderScope.task("requestHandshake", "Request a handshake with a provider")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("aesKey", "AES key encrypted with provider's public key")
  .addParam("testMessage", "Test message encrypted with AES key")
  .addParam("provider", "Address of the provider")
  .addParam("account", "Address of the user account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const tx = await messageProvider
      .connect(signer)
      .requestUserHandshakeWithProvider(taskArgs.aesKey, taskArgs.testMessage, taskArgs.provider);
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "RequestUserHandshakeWithProvider");
    if (event) {
      console.log("Handshake requested. Handshake hash:", event.args.handshake);
    } else {
      console.log("Handshake requested.");
    }
  });

// Task to respond to a handshake request
messageProviderScope.task("respondHandshake", "Respond to a handshake request")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("handshake", "Handshake hash")
  .addParam("status", "Approval status (true/false)")
  .addParam("account", "Address of the provider account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const status = taskArgs.status === "true";
    const tx = await messageProvider.connect(signer).responseUserHandshakeWithProvider(taskArgs.handshake, status);
    await tx.wait();
    console.log(`Handshake ${taskArgs.handshake} responded with status: ${status}`);
  });

// Task to revoke a handshake
messageProviderScope.task("revokeHandshake", "Revoke a handshake")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("handshake", "Handshake hash")
  .addParam("account", "Address of the account revoking the handshake")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const tx = await messageProvider.connect(signer).revokeHandshake(taskArgs.handshake);
    await tx.wait();
    console.log(`Handshake ${taskArgs.handshake} revoked by ${taskArgs.account}`);
  });

// Task to request sending an SMS
messageProviderScope.task("requestSendSMS", "Request to send an SMS")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("handshake", "Handshake hash")
  .addParam("recipient", "Target phone number")
  .addParam("text", "Message content")
  .addParam("value", "Amount to send with the transaction (in wei)")
  .addParam("account", "Address of the user account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const tx = await messageProvider
      .connect(signer)
      .requestSendSMS(taskArgs.handshake, taskArgs.recipient, taskArgs.text, { value: taskArgs.value });
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "RequestSendSMS");
    if (event) {
      console.log("SMS request sent. Message hash:", event.args.message_hash);
    } else {
      console.log("SMS request sent.");
    }
  });

// Task to respond to an SMS send request
messageProviderScope.task("respondSendSMS", "Respond to an SMS send request")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("messageHash", "Message hash")
  .addParam("status", "Delivery status (true/false)")
  .addParam("errorCode", "Error code if delivery failed")
  .addParam("account", "Address of the provider account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const status = taskArgs.status === "true";
    const tx = await messageProvider
      .connect(signer)
      .responseSendSMS(taskArgs.messageHash, status, taskArgs.errorCode);
    await tx.wait();
    console.log(`SMS ${taskArgs.messageHash} responded with status: ${status}`);
  });

// Task to request sending an Email
messageProviderScope.task("requestSendEmail", "Request to send an Email")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("handshake", "Handshake hash")
  .addParam("recipient", "Target email address")
  .addParam("subject", "Email subject")
  .addParam("body", "Email content")
  .addParam("value", "Amount to send with the transaction (in wei)")
  .addParam("account", "Address of the user account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const tx = await messageProvider
      .connect(signer)
      .requestSendEmail(taskArgs.handshake, taskArgs.recipient, taskArgs.subject, taskArgs.body, {
        value: taskArgs.value,
      });
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "RequestSendEmail");
    if (event) {
      console.log("Email request sent. Message hash:", event.args.message_hash);
    } else {
      console.log("Email request sent.");
    }
  });

// Task to respond to an Email send request
messageProviderScope.task("respondSendEmail", "Respond to an Email send request")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("messageHash", "Message hash")
  .addParam("status", "Delivery status (true/false)")
  .addParam("errorCode", "Error code if delivery failed")
  .addParam("account", "Address of the provider account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const status = taskArgs.status === "true";
    const tx = await messageProvider
      .connect(signer)
      .responseSendEmail(taskArgs.messageHash, status, taskArgs.errorCode);
    await tx.wait();
    console.log(`Email ${taskArgs.messageHash} responded with status: ${status}`);
  });

// Task to withdraw accumulated service fees
messageProviderScope.task("withdraw", "Withdraw accumulated service fees")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("account", "Address of the owner account")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const signer = await hre.ethers.getSigner(taskArgs.account);
    const tx = await messageProvider.connect(signer).withdraw();
    await tx.wait();
    console.log("Service fees withdrawn by:", taskArgs.account);
  });

// Task to get current service settings
messageProviderScope.task("getServiceInfo", "Get current service settings")
  .addParam("contract", "Address of the MessageProvider contract")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const settings = await messageProvider.getServiceInfo();
    console.log("Service Settings:", settings);
  });

// Task to get provider details
messageProviderScope.task("getProvider", "Get provider details")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("provider", "Address of the provider")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    const providerData = await messageProvider.getProvider(taskArgs.provider);
    console.log("Provider Data:", providerData);
  });

// Task to get handshake details
messageProviderScope.task("getHandshake", "Get handshake details")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("handshake", "Handshake hash")
  .addOptionalParam("account", "Address of the account to use for the call")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    let signer = taskArgs.account
      ? await hre.ethers.getSigner(taskArgs.account)
      : (await hre.ethers.getSigners())[0];
    const handshakeData = await messageProvider.connect(signer).getHandshake(taskArgs.handshake);
    console.log("Handshake Data:", handshakeData);
  });

// Task to get SMS message details
messageProviderScope.task("getSms", "Get SMS message details")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("messageHash", "Message hash")
  .addOptionalParam("account", "Address of the account to use for the call")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    let signer = taskArgs.account
      ? await hre.ethers.getSigner(taskArgs.account)
      : (await hre.ethers.getSigners())[0];
    const smsData = await messageProvider.connect(signer).getSms(taskArgs.messageHash);
    console.log("SMS Data:", smsData);
  });

// Task to get Email message details
messageProviderScope.task("getEmail", "Get Email message details")
  .addParam("contract", "Address of the MessageProvider contract")
  .addParam("messageHash", "Message hash")
  .addOptionalParam("account", "Address of the account to use for the call")
  .setAction(async (taskArgs, hre) => {
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);
    let signer = taskArgs.account
      ? await hre.ethers.getSigner(taskArgs.account)
      : (await hre.ethers.getSigners())[0];
    const emailData = await messageProvider.connect(signer).getEmail(taskArgs.messageHash);
    console.log("Email Data:", emailData);
  });

messageProviderScope.task("listenEvents", "Listen all events from contract MessageProvider")
  .addParam("contract", "Contract address MessageProvider")
  .setAction(async (taskArgs, hre) => {
    
    const messageProvider = await hre.ethers.getContractAt("MessageProvider", taskArgs.contract);

    console.log(`Listen all events from contract ${taskArgs.contract}...`);

    
    messageProvider.on("*", (event) => {
      console.log(`Event ${event.event} call with args:`, event.args);
    });

    
    await new Promise(() => {});
  });