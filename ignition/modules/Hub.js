const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");
const SMSMessageOracleModule = require("./SMSMessageOracle");
const EmailMessageOracleModule = require("./EmailMessageOracle");
const CurrenciesModule = require("./Currencies");

const proxyModule = buildModule("ProxyHub", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const demo = m.contract("Hub");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    demo,
    proxyAdminOwner,
    "0x",
  ]);

  const proxyAdminAddress = m.readEventArgument(
    proxy,
    "AdminChanged",
    "newAdmin"
  );

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { proxyAdmin, proxy };
});


const hubModule = buildModule("Hub", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);
  const { SMSMessageOracle } = m.useModule(SMSMessageOracleModule);
  const { EmailMessageOracle } = m.useModule(EmailMessageOracleModule);
  const { Currencies } = m.useModule(CurrenciesModule);
  const hub = m.contractAt("Hub", proxy);

  m.call(SMSMessageOracle, "initialize",[60n, 1n, false, "Message: [message]"]);
  m.call(EmailMessageOracle, "initialize",[60n, 1n, false, "Message: [message]"]);
  m.call(Currencies,"initialize")

  m.call(hub,"initialize",[[
    {
      name: "EmailService",
      contract_address: EmailMessageOracle
    },
    {
      name: "SMSService",
      contract_address: SMSMessageOracle
    },
    {
      name: "Currencies",
      contract_address: Currencies
    },
  ]])


  return { hub, proxy, proxyAdmin, SMSMessageOracle, EmailMessageOracle, Currencies};
});

module.exports = hubModule;