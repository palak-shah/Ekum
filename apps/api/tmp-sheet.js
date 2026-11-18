const { readFileSync } = require("fs");
const { join } = require("path");
console.log("cwd", process.cwd());
console.log("__dirname test via seed file", require.resolve("./dist/catalog/master-data/master-data.seed.js"));
const dir = require("path").dirname(require.resolve("./dist/catalog/master-data/master-data.seed.js"));
const candidates = [
  join(dir, "sheet-2026-10-14.json"),
  join(process.cwd(), "src", "catalog", "master-data", "sheet-2026-10-14.json"),
  join(process.cwd(), "apps", "api", "src", "catalog", "master-data", "sheet-2026-10-14.json"),
];
for (const p of candidates) {
  console.log("try", p);
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    console.log("ok categories", j.categories.length);
    break;
  } catch (e) {
    console.log("fail", e.code || e.message);
  }
}
