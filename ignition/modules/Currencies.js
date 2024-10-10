const { buildModule } =  require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyCurrencies", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const Currencies = m.contract("Currencies");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    Currencies,
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


const CurrenciesModule = buildModule("Currencies", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const Currencies = m.contractAt("Currencies", proxy);

  return { Currencies, proxy, proxyAdmin };
});

module.exports = CurrenciesModule;