const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyUserSupportChat", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const UserSupportChat = m.contract("UserSupportChat");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    UserSupportChat,
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


const UserSupportChatModule = buildModule("UserSupportChat", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const UserSupportChat = m.contractAt("UserSupportChat", proxy);

  return { UserSupportChat, proxy, proxyAdmin };
});

module.exports = UserSupportChatModule;