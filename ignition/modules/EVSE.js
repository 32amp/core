const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyEVSE", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const EVSE = m.contract("EVSE");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    EVSE,
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


const EVSEModule = buildModule("EVSE", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const EVSE = m.contractAt("EVSE", proxy);

  return { EVSE, proxy, proxyAdmin };
});

module.exports = EVSEModule;