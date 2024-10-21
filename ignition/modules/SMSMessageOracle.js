const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxySMSMessageOracle", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const SMSMessageOracle = m.contract("MessageOracle");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    SMSMessageOracle,
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


const SMSMessageOracleModule = buildModule("SMSMessageOracle", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const SMSMessageOracle = m.contractAt("MessageOracle", proxy);

  return { SMSMessageOracle, proxy, proxyAdmin };
});

module.exports = SMSMessageOracleModule;