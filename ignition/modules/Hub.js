const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

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

  const hub = m.contractAt("Hub", proxy);

  return { hub, proxy, proxyAdmin };
});

module.exports = hubModule;