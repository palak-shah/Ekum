const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient({ log: ["query"] });
(async () => {
  await p.$connect();
  console.log("findFirst insensitive");
  const r = await Promise.race([
    p.masterOption.findFirst({ where: { kind: "item_type", label: { equals: "Bedsheet", mode: "insensitive" } } }),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
  ]);
  console.log("result", r);
  await p.$disconnect();
})().catch(async (e) => { console.error(e.message); await p.$disconnect(); process.exit(1); });
