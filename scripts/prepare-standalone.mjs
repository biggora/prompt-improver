import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const STANDALONE = resolve(ROOT, ".next/standalone");

if (!existsSync(STANDALONE)) {
  console.error(
    "[.next/standalone] not found. Did you run `next build` with output: 'standalone'?",
  );
  process.exit(1);
}

const staticSrc = resolve(ROOT, ".next/static");
const staticDest = resolve(STANDALONE, ".next/static");
if (existsSync(staticSrc)) {
  mkdirSync(resolve(STANDALONE, ".next"), { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log("Copied .next/static -> standalone/.next/static");
}

const publicSrc = resolve(ROOT, "public");
const publicDest = resolve(STANDALONE, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log("Copied public -> standalone/public");
}

console.log("Standalone bundle prepared.");
