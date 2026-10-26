'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bodyParser = require('body-parser');

// A stub database: findOne fails, find records that it was reached and returns
// an empty cursor.
function serve(resource, state) {
  const app = express();
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.db = { collection: () => ({
      findOne(query, callback) { callback(new Error('offline')); },
      find(query, callback) {
        state.findCalled = true;
        callback(null, { each(visit) { visit(null, null); } });
      },
    }) };
    next();
  });
  app.use('/', require(`../routes/${resource}`));
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function withServer(resource, fn) {
  const state = {};
  const server = await serve(resource, state);
  try {
    await fn(`http://127.0.0.1:${server.address().port}`, state);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('games: a database failure on POST /:id is a 500, not a 400', () =>
  withServer('games', async (base) => {
    const response = await fetch(`${base}/g1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'n', owner: 'o', category: 'c' }),
    });
    assert.equal(response.status, 500);
    assert.match(await response.text(), /offline/);
  }));

test('games: missing parameters on POST /:id are still a 400', () =>
  withServer('games', async (base) => {
    const response = await fetch(`${base}/g1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'n' }),
    });
    assert.equal(response.status, 400);
    await response.text();
  }));

for (const resource of ['games', 'user']) {
  for (const q of ['5', '"abc"', '[1]', 'true']) {
    test(`${resource}: /list?q=${q} is refused before reaching the database`, () =>
      withServer(resource, async (base, state) => {
        const response = await fetch(`${base}/list?q=${encodeURIComponent(q)}`);
        assert.equal(response.status, 400);
        await response.text();
        assert.equal(state.findCalled, undefined);
      }));
  }

  for (const q of ['{"status":1}', 'null']) {
    test(`${resource}: /list?q=${q} is still accepted`, () =>
      withServer(resource, async (base, state) => {
        const response = await fetch(`${base}/list?q=${encodeURIComponent(q)}`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), []);
        assert.equal(state.findCalled, true);
      }));
  }
}
