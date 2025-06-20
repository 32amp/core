const seedrsScope = scope("Seedrs", "Seed demo data for some module");
const { accountSelection, partnerSelection, capitalsBounds} = require("./helpers/promt_selection");

seedrsScope.task("generate-locations", "Generate locations with random EVSEs inside and random connectors, random description")
.setAction(async (args,hre) => {
    const signer = await accountSelection(hre);
    const partner_id = await partnerSelection();
    const {capital,bounds} = await capitalsBounds()
    

})