'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// app.js logs the connection attempt as soon as it is required. The child
// exits right after, before the connection to the unreachable port gives up.
test('the debug log does not print the MongoDB password', () => {
  const app = JSON.stringify(path.join(__dirname, '..', 'app'));
  const env = {
    ...process.env,
    DEBUG: 'app',
    DEBUG_COLORS: 'no',
    MONGODB_URL: 'mongodb://kpax:s3cret-Pass@127.0.0.1:1/kpax2',
  };
  const result = spawnSync(process.execPath, ['-e', `require(${app}); process.exit(0);`], {
    env, encoding: 'utf8', timeout: 20000,
  });
  assert.equal(result.status, 0, result.stderr);
  const line = result.stderr.split('\n').find((l) => l.includes('Connecting to Mongodb'));
  assert.ok(line, result.stderr);
  assert.doesNotMatch(line, /s3cret-Pass/);
  assert.match(line, /mongodb:\/\/<credentials>@127\.0\.0\.1:1\/kpax2/);
});
