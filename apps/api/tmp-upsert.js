const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient({ log: ["query", "info", "warn", "error"] });
(async () => {
  console.log("connect");
  await p.$connect();
  console.log("upsert");
  await p.masterCategory.upsert({
    where: { slug: "test-boot-check" },
    create: { id: "cat_test_boot_check", slug: "test-boot-check", label: "Test", active: true, sortOrder: 0 },
    update: { label: "Test" },
  });
  console.log("ok");
  await p.masterCategory.delete({ where: { slug: "test-boot-check" } }).catch(() => {});
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
