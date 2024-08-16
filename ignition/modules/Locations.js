const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyLocations", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const Locations = m.contract("Location");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    Locations,
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


const LocationsModule = buildModule("Locations", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const Locations = m.contractAt("Location", proxy);

  return { Locations, proxy, proxyAdmin };
});

module.exports = LocationsModule;