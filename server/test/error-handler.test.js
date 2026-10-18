'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// app.js starts connecting to MongoDB as soon as it is required, and that
// attempt throws once it gives up. Each case therefore runs in its own process
// that exits as soon as it has its answer. A malformed JSON body fails in
// body-parser, before the database guard, so no database is needed to reach
// the error handler.
const child = `
  const app = require(${JSON.stringify(path.join(__dirname, '..', 'app'))});
  const server = app.listen(0, '127.0.0.1', async () => {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/game/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    process.stdout.write('\\nRESULT ' + JSON.stringify({ status: response.status, body: await response.text() }) + '\\n');
    process.exit(0);
  });
`;

function run(nodeEnv) {
  const env = { ...process.env, MONGODB_URL: 'mongodb://127.0.0.1:1/kpax2' };
  delete env.NODE_ENV;
  delete env.DEBUG;
  if (nodeEnv) env.NODE_ENV = nodeEnv;
  const result = spawnSync(process.execPath, ['-e', child], { env, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr);
  // morgan logs the request to stdout as well.
  const line = result.stdout.split('\n').find((l) => l.startsWith('RESULT '));
  assert.ok(line, result.stdout);
  return JSON.parse(line.slice('RESULT '.length));
}

test('without NODE_ENV the error page carries no stack trace', () => {
  const { status, body } = run();
  assert.equal(status, 400);
  assert.doesNotMatch(body, /node_modules|\bat [\w.<>]+ \(/);
});

test('NODE_ENV=development still shows the stack trace', () => {
  const { status, body } = run('development');
  assert.equal(status, 400);
  assert.match(body, /node_modules/);
});
