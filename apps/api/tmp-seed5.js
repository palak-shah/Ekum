const { PrismaClient } = require("@prisma/client");
const { seedMasterDataFromSheet } = require("./dist/catalog/master-data/master-data.seed");
const p = new PrismaClient();
(async () => {
  const started = Date.now();
  let last = started;
  const origUpsert = p.masterCategory.upsert.bind(p.masterCategory);
  p.masterCategory.upsert = async (...args) => {
    const now = Date.now();
    console.log(`cat ${args[0].where.slug} +${now - last}ms (total ${now - started}ms)`);
    last = now;
    return origUpsert(...args);
  };
  await p.$connect();
  const n = await seedMasterDataFromSheet(p);
  console.log(`DONE links=${n} in ${Date.now() - started}ms`);
  await p.$disconnect();
})().catch(async (e) => { console.error(e); await p.$disconnect(); process.exit(1); });
