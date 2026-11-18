const { PrismaClient } = require("@prisma/client");
const { seedMasterDataFromSheet } = require("./dist/catalog/master-data/master-data.seed");
const p = new PrismaClient();
console.time("seed");
seedMasterDataFromSheet(p)
  .then(async (n) => {
    console.timeEnd("seed");
    console.log("n", n);
    const opts = await p.masterOption.count();
    const cats = await p.masterCategory.count();
    console.log({ opts, cats });
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
