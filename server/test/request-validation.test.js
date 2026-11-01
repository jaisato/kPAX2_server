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

for (const [label, extra] of [
  ['owner as an object', { owner: { $gt: '' } }],
  ['category as an object', { category: { $ne: null } }],
  ['owner as a boolean', { owner: true }],
  ['description as an object', { description: { a: 1 } }],
  ['tags as a number', { tags: 3 }],
  ['tags with a non-string entry', { tags: ['a', { $set: 1 }] }],
]) {
  test(`games: POST /:id with ${label} is a 400`, () =>
    withServer('games', async (base) => {
      const response = await fetch(`${base}/g1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'n', owner: 'o', category: 'c', ...extra }),
      });
      assert.equal(response.status, 400);
      await response.text();
    }));
}

for (const [label, extra] of [
  ['numeric owner and category (as the Elgg frontend sends them)', { owner: 42, category: 3 }],
  ['a single tag as a string (Elgg metadata with one value)', { tags: 'puzzle' }],
  ['tags and description null', { tags: null, description: null }],
]) {
  test(`games: POST /:id accepts ${label}`, () =>
    withServer('games', async (base) => {
      const response = await fetch(`${base}/g1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'n', owner: 'o', category: 'c', ...extra }),
      });
      // the stub's findOne fails, so getting past validation means a 500
      assert.equal(response.status, 500);
      await response.text();
    }));
}

test('games: POST /:id with valid optional fields reaches the database', () =>
  withServer('games', async (base) => {
    const response = await fetch(`${base}/g1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'n', owner: 'o', category: 'c', description: 'd', tags: ['x'] }),
    });
    // the stub's findOne fails, so getting past validation means a 500
    assert.equal(response.status, 500);
    await response.text();
  }));

test('games: POST /:id stores a single string tag as a one-element array', async () => {
  const app = express();
  app.use(bodyParser.json());
  let update;
  app.use((req, res, next) => {
    req.db = { collection: () => ({
      findOne(query, callback) { callback(null, null); },
      updateOne(filter, doc, options, callback) { update = doc; callback(null, {}); },
    }) };
    next();
  });
  app.use('/', require('../routes/games'));
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/g1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'n', owner: 42, category: '3', tags: 'puzzle' }),
    });
    assert.equal(response.status, 200);
    await response.json();
    assert.deepEqual(update.$set.tags, ['puzzle']);
    assert.equal(update.$set.owner, 42);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
