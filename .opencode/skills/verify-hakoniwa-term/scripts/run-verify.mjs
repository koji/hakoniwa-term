#!/usr/bin/env node
// Scripted vitest slice + evidence capture for hakoniwa-term verification.
//   node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "streams logs" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>
//   node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --cleanup [--out <same>]
// Never deletes the artifacts dir. Cleanup stops only the PID in .verify-demo-pid.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const args = process.argv.slice(2);
const val = (k) => {
  const i = args.indexOf(k);
  return i !== -1 ? args[i + 1] : undefined;
};

if (args.includes("--cleanup")) {
  const pidFile = join(root, ".verify-demo-pid");
  if (existsSync(pidFile)) {
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(pid, "SIGTERM");
        console.log(`cleanup: stopped demo PID ${pid}`);
      } catch (err) {
        console.log(`cleanup: PID ${pid} already gone (${err.code ?? err.message})`);
      }
    }
    rmSync(pidFile, { force: true });
  } else {
    console.log("cleanup: no .verify-demo-pid (nothing started by this run)");
  }
  const out = val("--out");
  if (out) {
    const dir = resolve(root, out);
    const t = join(dir, "vitest-transcript.txt");
    const r = join(dir, "result.json");
    console.log(`cleanup: evidence check: transcript ${existsSync(t) ? "PRESENT" : "MISSING"} (${t})`);
    console.log(`cleanup: evidence check: result.json ${existsSync(r) ? "PRESENT" : "MISSING"} (${r})`);
    if (!existsSync(t) || !existsSync(r)) process.exit(1);
  }
  process.exit(0);
}

const testName = val("--test-name");
const out = val("--out");
if (!testName || !out) {
  console.error('usage: run-verify.mjs --test-name "<vitest -t filter>" --out <artifacts dir>');
  process.exit(2);
}
const dir = resolve(root, out);
mkdirSync(dir, { recursive: true });

// Guardrail: must run from the hakoniwa-term root.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.name !== "hakoniwa-term") {
  console.error(`run-verify: cwd is not the hakoniwa-term root (found package ${pkg.name})`);
  process.exit(2);
}

const vitestArgs = ["vitest", "run", "src/Terminal.test.tsx", "-t", testName, "--reporter=verbose"];
console.log(`run-verify: pnpm ${vitestArgs.join(" ")}`);
const started = Date.now();
const run = spawnSync("pnpm", vitestArgs, { cwd: root, encoding: "utf8", shell: true });
const durationMs = Date.now() - started;
const transcript = [
  `# hakoniwa-term verify transcript`,
  `# testName: ${testName}`,
  `# command: pnpm ${vitestArgs.join(" ")}`,
  `# exitCode: ${run.status}`,
  `# durationMs: ${durationMs}`,
  `# timestamp: ${new Date().toISOString()}`,
  ``,
  `--- stdout ---`,
  run.stdout ?? "",
  `--- stderr ---`,
  run.stderr ?? "",
].join("\n");
writeFileSync(join(dir, "vitest-transcript.txt"), transcript);
const passed = run.status === 0;
writeFileSync(
  join(dir, "result.json"),
  JSON.stringify({ testName, exitCode: run.status, passed, durationMs, timestamp: new Date().toISOString() }, null, 2),
);
console.log(`run-verify: ${passed ? "PASSED" : "FAILED"} (exit ${run.status}), evidence in ${dir}`);
process.exit(run.status ?? 1);
