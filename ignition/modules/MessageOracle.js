const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyMessageOracle", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const MessageOracle = m.contract("MessageOracle");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    MessageOracle,
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


const MessageOracleModule = buildModule("MessageOracle", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const MessageOracle = m.contractAt("MessageOracle", proxy);

  return { MessageOracle, proxy, proxyAdmin };
});

module.exports = MessageOracleModule;