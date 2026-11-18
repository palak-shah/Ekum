const { PrismaClient } = require("@prisma/client");
const { seedMasterDataFromSheet } = require("./dist/catalog/master-data/master-data.seed");
const p = new PrismaClient();
const orig = p.masterCategory.upsert;
p.masterCategory.upsert = function (...args) {
  console.log("upsert invoked", args[0]?.where);
  return orig.apply(this, args).then((r) => { console.log("upsert resolved"); return r; });
};
(async () => {
  await p.$connect();
  console.log("connected, starting seed");
  console.log("about to call");
  const n = await Promise.race([
    seedMasterDataFromSheet(p),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout 15s")), 15000)),
  ]);
  console.log("done", n);
  await p.$disconnect();
})().catch(async (e) => { console.error("err", e.message); await p.$disconnect(); process.exit(1); });
