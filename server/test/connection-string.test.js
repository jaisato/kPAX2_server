'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const utils = require('../lib/utils');

for (const [label, url, expected] of [
  ['user and password', 'mongodb://kpaxuser:S3cr3t@127.0.0.1:27017/kpax2',
    'mongodb://kpaxuser:***@127.0.0.1:27017/kpax2'],
  ['a replica set', 'mongodb://u:p@h1:27017,h2:27017/kpax2?replicaSet=rs0',
    'mongodb://u:***@h1:27017,h2:27017/kpax2?replicaSet=rs0'],
  ['an SRV record and an escaped password', 'mongodb+srv://u:p%40ss@cluster0.example.net/kpax2',
    'mongodb+srv://u:***@cluster0.example.net/kpax2'],
  ['an "@" left unescaped in the password', 'mongodb://u:p@ss@h1/kpax2',
    'mongodb://u:***@h1/kpax2'],
  ['a "/" left unescaped in the password', 'mongodb://u:pa/ss@h1:27017/kpax2',
    'mongodb://u:***@h1:27017/kpax2'],
  ['a "?" or "#" left unescaped in the password', 'mongodb://u:p?a#ss@h1/kpax2?replicaSet=rs0',
    'mongodb://u:***@h1/kpax2?replicaSet=rs0'],
  ['no credentials', 'mongodb://localhost:27017/kpax2', 'mongodb://localhost:27017/kpax2'],
  ['a user without a password', 'mongodb://u@h1:27017/kpax2', 'mongodb://u@h1:27017/kpax2'],
]) {
  test(`withoutPassword: ${label}`, () => {
    assert.equal(utils.withoutPassword(url), expected);
  });
}

test('with DEBUG on, the connection string is logged without its password', () => {
  const env = { ...process.env, DEBUG: 'app', MONGODB_URL: 'mongodb://kpaxuser:S3cr3t-Pa55@127.0.0.1:1/kpax2' };
  delete env.NODE_ENV;
  // app.js logs the URL as it is loaded; nothing has to connect.
  const result = spawnSync(process.execPath,
    ['-e', `require(${JSON.stringify(path.join(__dirname, '..', 'app'))}); process.exit(0);`],
    { env, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Connecting to Mongodb mongodb:\/\/kpaxuser:\*\*\*@127\.0\.0\.1:1\/kpax2/);
  assert.doesNotMatch(result.stderr, /S3cr3t-Pa55/);
});
