import { cpSync } from "node:fs";
import path from "node:path";

const src = path.join("src", "data");
const dest = path.join("dist", "data");

cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
