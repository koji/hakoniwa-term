#!/usr/bin/env node
// Read-only readiness check for hakoniwa-term verification.
// Usage: node .opencode/skills/verify-hakoniwa-term/scripts/doctor.mjs [--port 5199]
// Exit 0 = worth driving. Non-zero = prints the exact fix. Changes nothing.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";

const root = resolve(process.cwd());
const failures = [];
const notes = [];
const flag = (ok, msg, fix) => {
  notes.push(`${ok ? "ok" : "FAIL"}  ${msg}`);
  if (!ok) failures.push(fix ? `${msg} -> fix: ${fix}` : msg);
};

const portArg = process.argv.indexOf("--port");
const port = portArg !== -1 ? Number(process.argv[portArg + 1]) : 5199;

// 1. Repo root identity.
let pkg = null;
try {
  pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
} catch { /* handled below */ }
flag(pkg?.name === "hakoniwa-term", `package.json name is hakoniwa-term (cwd: ${root})`, "cd to the hakoniwa-term repo root");

// 2. Deps installed.
flag(existsSync(join(root, "node_modules")) && existsSync(join(root, "node_modules", "vitest")), "node_modules + vitest installed", "pnpm install (root, pnpm 10.32.1 per mise.toml)");

// 3. Library built (what the playground aliases resolve to).
for (const f of ["dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.css"]) {
  flag(existsSync(join(root, f)), `built artifact present: ${f}`, "pnpm build");
}

// 4. Source + harness files the skill drives.
for (const f of ["src/Terminal.tsx", "src/index.ts", "vitest.config.ts", "src/test/setup.ts", "src/Terminal.test.tsx"]) {
  flag(existsSync(join(root, f)), `source/harness file present: ${f}`, "git status --short (file missing from checkout)");
}

// 5. TERMINAL_PRESETS importable surface (static check, no build needed).
try {
  const src = await readFile(join(root, "src", "Terminal.tsx"), "utf8");
  const presets = ["emerald", "matrix", "dracula", "amber", "cyberpunk", "light"];
  flag(presets.every((p) => src.includes(p)), "TERMINAL_PRESETS exposes 6 presets", "inspect src/Terminal.tsx TERMINAL_PRESETS");
} catch {
  flag(false, "src/Terminal.tsx readable", "inspect src/Terminal.tsx");
}

// 6. Playground present (visual drive only).
flag(existsSync(join(root, "example", "hakoniwa-sample-3", "src", "App.tsx")), "playground present: example/hakoniwa-sample-3/src/App.tsx", "visual drive unavailable; use headless vitest only");

// 7. Verify port free or owned by this run.
const pidFile = join(root, ".verify-demo-pid");
let ownedPid = null;
try {
  ownedPid = Number(readFileSync(pidFile, "utf8").trim());
} catch { /* no pid file = no owned instance */ }
const portFree = await new Promise((resolveFree) => {
  const srv = createServer();
  srv.once("error", () => resolveFree(false));
  srv.once("listening", () => srv.close(() => resolveFree(true)));
  srv.listen(port, "127.0.0.1");
});
flag(
  portFree || (Number.isFinite(ownedPid) && ownedPid > 0),
  `verify port ${port} free${ownedPid ? ` or owned by PID ${ownedPid}` : ""}`,
  portFree ? "n/a" : `port ${port} is busy and not ours: pick another --port or stop the owner (never taskkill by name)`,
);

console.log(notes.join("\n"));
if (failures.length > 0) {
  console.error(`\ndoctor: NOT READY (${failures.length} problem${failures.length === 1 ? "" : "s"})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log("\ndoctor: READY");
