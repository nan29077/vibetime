import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("production test-login actions are disabled", () => {
  const source = read("src/lib/actions/auth-actions.ts");
  // 테스트 계정 로그인은 testAccountsEnabled() 가드로 차단된다.
  assert.match(source, /async function loginAs[\s\S]*testAccountsEnabled\(\)/);
  const accounts = read("src/lib/test-accounts.ts");
  assert.match(accounts, /export function testAccountsEnabled[\s\S]*NODE_ENV !== "production"/);
});

test("participation review uses idempotent wallet rewards", () => {
  for (const file of [
    "src/app/api/participations/[id]/review/route.ts",
    "src/app/api/advertiser/campaigns/[id]/review/route.ts",
    "src/lib/actions/campaign-actions.ts",
  ]) {
    const source = read(file);
    assert.match(source, /addWalletTxOnce/);
  }
});

test("creator submission never falls back to another participation type", () => {
  const source = read("src/app/api/creator/campaigns/[id]/submit/route.ts");
  assert.doesNotMatch(source, /candidates\[0\]/);
  assert.match(source, /participation_type/);
});

test("download validates participation ownership and campaign", () => {
  const source = read("src/app/api/creator/campaigns/[id]/download/route.ts");
  assert.match(source, /participation\.creator_id !== user\.id/);
  assert.match(source, /participation\.campaign_id !== params\.id/);
});

test("private uploads are outside public and downloaded through authorization", () => {
  const upload = read("src/app/api/creator/requests/upload/route.ts");
  const storage = read("src/lib/storage.ts");
  assert.match(upload, /storage\.save/);
  assert.match(storage, /data", "private-uploads/);
  assert.doesNotMatch(upload, /"public", "uploads"/);
  assert.doesNotMatch(storage, /"public", "uploads"/);
  assert.ok(fs.existsSync(path.join(root, "src/app/api/files/[id]/route.ts")));
});

test("ledger snapshot is reconciled and contains no duplicate rewards", () => {
  const result = spawnSync(process.execPath, ["scripts/reconcile-ledgers.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.summary, { wallet_mismatches: 0, point_mismatches: 0, duplicate_reward_groups: 0 });
});
