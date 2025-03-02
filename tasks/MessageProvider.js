const { loadConfig, saveConfig } = require("./helpers/configs")
const { accountSelection } = require("./helpers/promt_selection");
const messageProviderScope = scope("MessageProvider", "Tasks for MessageOracle service");
const inquirer = require("inquirer");


// Task to deploy and initialize the MessageProvider contract
messageProviderScope.task("deploy", "Deploy and initialize the MessageProvider contract")
  .setAction(async (taskArgs, hre) => {
    var config;

    try {
      config = await loadConfig("config")

    } catch (error) {
      config = {};
    }

    if (typeof config?.deployed?.MessageProvider != "undefined")
      throw new Error("MessageProvider already deployed")


    settingsData = await loadConfig("MessageProvider");

    settingsData.min_provider_deposit = hre.ethers.parseEther(settingsData.min_provider_deposit);
    settingsData.min_cost_per_message = hre.ethers.parseEther(settingsData.min_cost_per_message);
    settingsData.service_fee = hre.ethers.parseEther(settingsData.service_fee);
    settingsData.punishment_coast = hre.ethers.parseEther(settingsData.punishment_coast);

    const MessageProvider = await hre.ethers.getContractFactory("MessageProvider");
    const messageProvider = await hre.upgrades.deployProxy(MessageProvider, [settingsData], {
      initializer: "initialize",
    });
    const deployed = await messageProvider.waitForDeployment();


    if (typeof config?.deployed == "undefined")
      config.deployed = {}

    config.deployed.MessageProvider = deployed.target;

    await saveConfig("config", config)

    console.log("MessageProvider deployed to:", deployed.target);
    return deployed.target;
  });


// Reusable function to initialize the MessageProvider contract instance
async function getMessageProvider(hre) {
  const config = await loadConfig("config");
  if (typeof config?.deployed?.MessageProvider === "undefined") {
      throw new Error("MessageProvider not deployed");
  }
  const signer = await accountSelection(hre);
  const messageProvider = await hre.ethers.getContractAt("MessageProvider", config.deployed.MessageProvider, signer);
  return messageProvider;
}

messageProviderScope.task("listen-events", "Listen all events from contract MessageProvider")
  .setAction(async (taskArgs, hre) => {

    const messageProvider = await getMessageProvider(hre);

    console.log(`Listen all events from contract ${taskArgs.contract}...`);

    messageProvider.on("*", (event) => {
      console.log(`Event ${event.event} call with args:`, event.args);
    });


    await new Promise(() => { });
  });

// Task to get service information
messageProviderScope.task("get-service-info", "Get service info")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const serviceInfo = await messageProvider.getServiceInfo();
      console.log("Service Settings:", serviceInfo);
  });

// Task to change processing time
messageProviderScope.task("change-processing-time", "Change processing time")
  .addParam("time", "New processing time")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.changeProcessingTime(taskArgs.time);
      await tx.wait();
      console.log("Processing time changed successfully");
  });

// Task to change service wallet
messageProviderScope.task("change-service-wallet", "Change service wallet address")
  .addParam("wallet", "New service wallet address")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.changeServiceWallet(taskArgs.wallet);
      await tx.wait();
      console.log("Service wallet changed successfully");
  });

// Task to change service fee
messageProviderScope.task("change-service-fee", "Change service fee")
  .addParam("fee", "New service fee")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.changeServiceFee(taskArgs.fee);
      await tx.wait();
      console.log("Service fee changed successfully");
  });

// Task to change minimum cost per message
messageProviderScope.task("change-min-cost-per-message", "Change minimum cost per message")
  .addParam("cost", "New minimum cost per message")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.changeMinCoastPerMessage(taskArgs.cost);
      await tx.wait();
      console.log("Minimum cost per message changed successfully");
  });

// Task to change minimum provider deposit
messageProviderScope.task("change-min-provider-deposit", "Change minimum provider deposit")
  .addParam("deposit", "New minimum provider deposit")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.changeMinProviderDeposit(taskArgs.deposit);
      await tx.wait();
      console.log("Minimum provider deposit changed successfully");
  });

// Task to withdraw funds
messageProviderScope.task("withdraw", "Withdraw funds from the contract")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.withdraw();
      await tx.wait();
      console.log("Funds withdrawn successfully");
  });

// Task to register a new provider
messageProviderScope.task("register-provider", "Register a new provider")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'country_code', message: 'Enter country code:' },
          { type: 'input', name: 'public_key', message: 'Enter public key:' },
          { type: 'input', name: 'terms', message: 'Enter terms of service:' },
          { type: 'confirm', name: 'sms_enabled', message: 'Enable SMS gateway?' },
          { type: 'input', name: 'sms_sender_name', message: 'Enter SMS sender name:', when: answers => answers.sms_enabled },
          { type: 'input', name: 'sms_cost_per_message', message: 'Enter SMS cost per message:', when: answers => answers.sms_enabled },
          { type: 'input', name: 'sms_time_between_retry', message: 'Enter SMS time between retry:', when: answers => answers.sms_enabled },
          { type: 'confirm', name: 'email_enabled', message: 'Enable Email gateway?' },
          { type: 'input', name: 'email_sender_name', message: 'Enter Email sender name:', when: answers => answers.email_enabled },
          { type: 'input', name: 'email_cost_per_message', message: 'Enter Email cost per message:', when: answers => answers.email_enabled },
          { type: 'input', name: 'email_time_between_retry', message: 'Enter Email time between retry:', when: answers => answers.email_enabled },
          { type: 'input', name: 'deposit', message: 'Enter deposit amount (in ether):' }
      ];

      const answers = await inquirer.prompt(prompts);

      const smsGetway = {
          enable: answers.sms_enabled,
          sender_name: answers.sms_enabled ? answers.sms_sender_name : '',
          cost_per_message: answers.sms_enabled ? answers.sms_cost_per_message : '0',
          time_between_retry: answers.sms_enabled ? answers.sms_time_between_retry : '0'
      };

      const emailGetway = {
          enable: answers.email_enabled,
          sender_name: answers.email_enabled ? answers.email_sender_name : '',
          cost_per_message: answers.email_enabled ? answers.email_cost_per_message : '0',
          time_between_retry: answers.email_enabled ? answers.email_time_between_retry : '0'
      };

      const provider = {
          country_code: answers.country_code,
          public_key: answers.public_key,
          terms: answers.terms,
          sms_getway: smsGetway,
          email_getway: emailGetway
      };

      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.registerProvider(provider, {
          value: hre.ethers.utils.parseEther(answers.deposit)
      });
      await tx.wait();
      console.log("Provider registered successfully");
  });

// Task to get provider data
messageProviderScope.task("get-provider", "Get provider data")
  .addParam("provider", "Provider address")
  .setAction(async (taskArgs, hre) => {
      const messageProvider = await getMessageProvider(hre);
      const providerData = await messageProvider.getProvider(taskArgs.provider);
      console.log("Provider Data:", providerData);
  });

// Task to request a user handshake with a provider
messageProviderScope.task("request-user-handshake-with-provider", "Request user handshake with provider")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'aes_key', message: 'Enter AES key:' },
          { type: 'input', name: 'test_message', message: 'Enter test message:' },
          { type: 'input', name: 'provider', message: 'Enter provider address:' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.requestUserHandshakeWithProvider(
          answers.aes_key,
          answers.test_message,
          answers.provider
      );
      await tx.wait();
      console.log("Handshake request sent successfully");
  });

// Task to respond to a user handshake
messageProviderScope.task("response-user-handshake-with-provider", "Respond to user handshake")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'handshake', message: 'Enter handshake (bytes32):' },
          { type: 'confirm', name: 'status', message: 'Approve handshake?' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.responseUserHandshakeWithProvider(
          answers.handshake,
          answers.status
      );
      await tx.wait();
      console.log("Handshake response sent successfully");
  });

// Task to revoke a handshake
messageProviderScope.task("revoke-handshake", "Revoke a handshake")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'handshake', message: 'Enter handshake to revoke:' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.revokeHandshake(answers.handshake);
      await tx.wait();
      console.log("Handshake revoked successfully");
  });

// Task to get handshake data
messageProviderScope.task("get-handshake", "Get handshake data")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'handshake', message: 'Enter handshake:' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const handshakeData = await messageProvider.getHandshake(answers.handshake);
      console.log("Handshake Data:", handshakeData);
  });

// Task to request sending an SMS
messageProviderScope.task("request-send-sms", "Request to send an SMS")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'handshake', message: 'Enter handshake:' },
          { type: 'input', name: 'recipient', message: 'Enter recipient phone number:' },
          { type: 'input', name: 'text', message: 'Enter message text:' },
          { type: 'input', name: 'amount', message: 'Enter amount to send (in ether):' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.requestSendSMS(
          answers.handshake,
          answers.recipient,
          answers.text,
          { value: hre.ethers.utils.parseEther(answers.amount) }
      );
      await tx.wait();
      console.log("SMS request sent successfully");
  });

// Task to respond to an SMS send request
messageProviderScope.task("response-send-sms", "Respond to SMS send request")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'message_hash', message: 'Enter message hash:' },
          { type: 'confirm', name: 'status', message: 'Was the SMS delivered successfully?' },
          { type: 'input', name: 'error_code', message: 'Enter error code (0 for success):' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.responseSendSMS(
          answers.message_hash,
          answers.status,
          answers.error_code
      );
      await tx.wait();
      console.log("SMS response sent successfully");
  });

// Task to get SMS message data
messageProviderScope.task("get-sms", "Get SMS message data")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'message_hash', message: 'Enter message hash:' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const smsData = await messageProvider.getSms(answers.message_hash);
      console.log("SMS Data:", smsData);
  });

// Task to request sending an Email
messageProviderScope.task("request-send-email", "Request to send an Email")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'handshake', message: 'Enter handshake:' },
          { type: 'input', name: 'recipient', message: 'Enter recipient email:' },
          { type: 'input', name: 'subject', message: 'Enter email subject:' },
          { type: 'input', name: 'body', message: 'Enter email body:' },
          { type: 'input', name: 'amount', message: 'Enter amount to send (in ether):' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.requestSendEmail(
          answers.handshake,
          answers.recipient,
          answers.subject,
          answers.body,
          { value: hre.ethers.utils.parseEther(answers.amount) }
      );
      await tx.wait();
      console.log("Email request sent successfully");
  });

// Task to respond to an Email send request
messageProviderScope.task("response-send-email", "Respond to Email send request")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'message_hash', message: 'Enter message hash:' },
          { type: 'confirm', name: 'status', message: 'Was the Email delivered successfully?' },
          { type: 'input', name: 'error_code', message: 'Enter error code (0 for success):' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const tx = await messageProvider.responseSendEmail(
          answers.message_hash,
          answers.status,
          answers.error_code
      );
      await tx.wait();
      console.log("Email response sent successfully");
  });

// Task to get Email message data
messageProviderScope.task("get-email", "Get Email message data")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'message_hash', message: 'Enter message hash:' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      const emailData = await messageProvider.getEmail(answers.message_hash);
      console.log("Email Data:", emailData);
  });

// Task to validate a handshake
messageProviderScope.task("validate-handshake", "Validate a handshake")
  .setAction(async (taskArgs, hre) => {
      const prompts = [
          { type: 'input', name: 'handshake', message: 'Enter handshake:' }
      ];
      const answers = await inquirer.prompt(prompts);
      const messageProvider = await getMessageProvider(hre);
      try {
          await messageProvider.validateHandshake(answers.handshake);
          console.log("Handshake is valid");
      } catch (error) {
          console.log("Handshake is invalid:", error.message);
      }
  });  