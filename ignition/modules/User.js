const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyUser", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const demo = m.contract("User");

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


const userModule = buildModule("User", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const user = m.contractAt("User", proxy);

  return { user, proxy, proxyAdmin };
});

module.exports = userModule;