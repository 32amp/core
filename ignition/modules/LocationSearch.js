const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyLocationSearch", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const LocationSearch = m.contract("LocationSearch");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    LocationSearch,
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


const LocationSearchModule = buildModule("LocationSearch", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const LocationSearch = m.contractAt("LocationSearch", proxy);

  return { LocationSearch, proxy, proxyAdmin };
});

module.exports = LocationSearchModule;