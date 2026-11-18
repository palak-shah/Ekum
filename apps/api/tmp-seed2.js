console.log("1");
const { PrismaClient } = require("@prisma/client");
console.log("2");
const seed = require("./dist/catalog/master-data/master-data.seed");
console.log("3", Object.keys(seed));
const p = new PrismaClient();
console.log("4 calling seed");
const t = setInterval(() => console.log("still running", new Date().toISOString()), 5000);
seed.seedMasterDataFromSheet(p)
  .then(async (n) => {
    clearInterval(t);
    console.log("done", n);
    await p.$disconnect();
  })
  .catch(async (e) => {
    clearInterval(t);
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
