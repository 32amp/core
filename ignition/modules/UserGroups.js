const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyUserGroups", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const UserGroups = m.contract("UserGroups");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    UserGroups,
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


const UserGroupsModule = buildModule("UserGroups", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const UserGroups = m.contractAt("UserGroups", proxy);

  return { UserGroups, proxy, proxyAdmin };
});

module.exports = UserGroupsModule;