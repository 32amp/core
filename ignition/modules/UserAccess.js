const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyUserAccess", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const UserAccess = m.contract("UserAccess");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    UserAccess,
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


const UserAccessModule = buildModule("UserAccess", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const UserAccess = m.contractAt("UserAccess", proxy);

  return { UserAccess, proxy, proxyAdmin };
});

module.exports = UserAccessModule;