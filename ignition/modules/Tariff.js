const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyTariff", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const Tariff = m.contract("Tariff");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    Tariff,
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


const TariffModule = buildModule("Tariff", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const Tariff = m.contractAt("Tariff", proxy);

  return { Tariff, proxy, proxyAdmin };
});

module.exports = TariffModule;