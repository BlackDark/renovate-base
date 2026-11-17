// Exercise Renovate's actual preset resolution and update precedence. The CI
// container pins Renovate; revisit these internal imports when upgrading it.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.env.RENOVATE_DIR;
assert(root, 'Set RENOVATE_DIR to the Renovate package directory');
const require = createRequire(resolve(root, 'package.json'));
const JSON5 = require('json5');
const load = (path) => import(pathToFileURL(resolve(root, 'dist', path)));
const [{ resolveConfigPresets }, { mergeChildConfig }, { getOptions }, { flattenUpdates }] = await Promise.all([
  load('config/presets/index.js'),
  load('config/utils.js'),
  load('config/options/index.js'),
  load('workers/repository/updates/flatten.js'),
]);
const parse = async (path) => JSON5.parse(await readFile(path, 'utf8'));
const shared = await parse('default.json5');
const example = await parse('tests/no-automerge.json5');
assert.deepEqual(example.extends, ['github>blackdark/renovate-base//default.json5']);
// Resolve the checked-out preset, not main on GitHub, so PR changes are tested.
delete example.extends;
const { config: preset } = await resolveConfigPresets(shared);
const defaults = Object.fromEntries(getOptions().filter((option) => option.default !== undefined).map((option) => [option.name, option.default]));
const base = mergeChildConfig(defaults, preset);
const types = ['major', 'minor', 'patch', 'pin', 'pinDigest', 'digest'];
const deps = types.map((updateType, i) => ({
  depName: `fixture-${i}`,
  packageName: `fixture-${i}`,
  depType: 'dependencies',
  currentValue: '1.0.0',
  currentVersion: '1.0.0',
  updates: [{ updateType, newVersion: '1.1.0', newValue: '1.1.0' }],
}));
const makeUpdates = (config) => flattenUpdates(config, { npm: [{ packageFile: 'package.json', deps: structuredClone(deps) }] });
const baseline = await makeUpdates(base);
assert(baseline.some((update) => update.automerge === true), 'Fixture must expose inherited automerge');
const updates = await makeUpdates(mergeChildConfig(base, example));
for (const type of [...types, 'lockFileMaintenance']) {
  const update = updates.find((item) => item.updateType === type);
  assert(update, `Missing ${type} fixture`);
  assert.equal(update.automerge, false, `${type} must not automerge`);
}
console.log('Inherited automerge is disabled for all fixture update types');
