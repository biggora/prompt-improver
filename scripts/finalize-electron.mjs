import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve("dist-electron");
mkdirSync(dir, { recursive: true });
writeFileSync(
  resolve(dir, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);
console.log("Wrote dist-electron/package.json (type: commonjs)");
