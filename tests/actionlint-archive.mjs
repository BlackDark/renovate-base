// Test Renovate's extraction and replacement with a known pair of releases.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.env.RENOVATE_DIR;
assert(root, 'Set RENOVATE_DIR to the Renovate package directory');
const JSON5 = createRequire(resolve(root, 'package.json'))('json5');
const load = (path) => import(pathToFileURL(resolve(root, 'dist', path)));
const [{ extractPackageFile }, { doAutoReplace }, { GlobalConfig }] = await Promise.all([
  load('modules/manager/custom/regex/index.js'),
  load('workers/repository/update/branch/auto-replace.js'),
  load('config/global.js'),
]);
const preset = JSON5.parse(await readFile('default.json5', 'utf8'));
const manager = preset.customManagers.find((item) => item.depNameTemplate === 'rhysd/actionlint');
assert(manager, 'Missing actionlint manager');
const packageFile = '.github/workflows/ci.yml';
for (const file of [packageFile, '.github/workflows/ci.yaml', 'snippets/ci.yml']) {
  assert(new RegExp(manager.managerFilePatterns[0].slice(1, -1)).test(file), `${file} must be scanned`);
}
const oldHash = '900919a84f2229bac68ca9cd4103ea297abc35e9689ebb842c6e34a3d1b01b0a';
const newHash = '8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8';
const content = `env:\n  # actionlint-archive\n  ACTIONLINT_VERSION: "v1.7.11"\n  ACTIONLINT_SHA256: "${oldHash}"\n`;
const extracted = extractPackageFile(content, packageFile, manager);
assert.equal(extracted?.deps.length, 1);
assert.equal(extracted.deps[0].currentValue, 'v1.7.11');
assert.equal(extracted.deps[0].currentDigest, oldHash);
const dir = await mkdtemp(join(tmpdir(), 'renovate-actionlint-'));
try {
  GlobalConfig.set({ localDir: dir });
  const upgrade = { ...manager, ...extracted.deps[0], manager: 'regex', packageFile, depIndex: 0, newValue: 'v1.7.12', newDigest: newHash };
  const updated = await doAutoReplace(upgrade, content, false);
  assert(updated.includes('ACTIONLINT_VERSION: "v1.7.12"'));
  assert(updated.includes(`ACTIONLINT_SHA256: "${newHash}"`));
  assert(!updated.includes(oldHash));
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log('Actionlint version and archive digest update together');
