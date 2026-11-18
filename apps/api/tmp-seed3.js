const { PrismaClient } = require("@prisma/client");
const { seedMasterDataFromSheet } = require("./dist/catalog/master-data/master-data.seed");
const p = new PrismaClient({ log: ["info", "warn", "error"] });
(async () => {
  console.log("preconnect");
  await p.$connect();
  console.log("seeding");
  const t = setInterval(() => console.log("heartbeat", Date.now()), 3000);
  const n = await seedMasterDataFromSheet(p);
  clearInterval(t);
  console.log("done", n);
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
