const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyEmailMessageOracle", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const EmailMessageOracle = m.contract("MessageOracle");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    EmailMessageOracle,
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


const EmailMessageOracleModule = buildModule("EmailMessageOracle", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const EmailMessageOracle = m.contractAt("MessageOracle", proxy);
  
  return { EmailMessageOracle, proxy, proxyAdmin };
});

module.exports = EmailMessageOracleModule;