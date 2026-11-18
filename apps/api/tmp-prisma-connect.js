console.log("start");
const { PrismaClient } = require("@prisma/client");
console.log("client loaded");
const p = new PrismaClient({ log: ["info", "warn", "error"] });
console.log("constructed");
p.$connect().then(async () => {
  console.log("connected");
  const n = await p.$queryRaw`SELECT 1 as x`;
  console.log("query", n);
  await p.$disconnect();
  console.log("done");
}).catch(async (e) => {
  console.error("fail", e);
  process.exit(1);
});
