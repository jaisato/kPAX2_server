'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { redactCredentials } = require('../lib/utils');

for (const [url, expected] of [
  ['mongodb://alice:s3cret@db.example:27017/kpax2', 'mongodb://****@db.example:27017/kpax2'],
  ['mongodb+srv://alice:s3cret@cluster0.example/kpax2', 'mongodb+srv://****@cluster0.example/kpax2'],
  ['mongodb://alice:p@ss@h1:27017,h2:27017/kpax2', 'mongodb://****@h1:27017,h2:27017/kpax2'],
  ['mongodb://localhost:27017/kpax2', 'mongodb://localhost:27017/kpax2'],
]) {
  test(`redactCredentials(${url})`, () => {
    assert.equal(redactCredentials(url), expected);
  });
}

test('with DEBUG=* the startup log does not print the database password', () => {
  // app.js logs the URL as soon as it is required; nothing else is needed.
  const env = {
    ...process.env,
    DEBUG: '*',
    MONGODB_URL: 'mongodb://alice:s3cret@127.0.0.1:1/kpax2',
  };
  const script = `require(${JSON.stringify(path.join(__dirname, '..', 'app'))}); process.exit(0);`;
  const result = spawnSync(process.execPath, ['-e', script], { env, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Connecting to Mongodb/);
  assert.doesNotMatch(result.stderr + result.stdout, /s3cret/);
});
