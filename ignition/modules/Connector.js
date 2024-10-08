const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyConnector", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const Connector = m.contract("Connector");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    Connector,
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


const ConnectorModule = buildModule("Connector", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const Connector = m.contractAt("Connector", proxy);

  return { Connector, proxy, proxyAdmin };
});

module.exports = ConnectorModule;