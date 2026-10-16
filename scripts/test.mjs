import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const tests = ["lib", "app", "app/components"].flatMap(directory => readdirSync(path.join(root, directory)).filter(name => name.endsWith(".test.mjs")).map(name => path.join(directory, name)));
const result = spawnSync(process.execPath, ["--test", ...process.argv.slice(2), ...tests], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
