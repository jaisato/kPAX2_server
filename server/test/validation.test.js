'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bodyParser = require('body-parser');

const utils = require('../lib/utils');

// Mounts one router on a throwaway app whose req.db is the given fake, and
// returns a fetch helper bound to it.
async function withRouter(resource, collection, run) {
  const app = express();
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.db = { collection: () => collection };
    next();
  });
  app.use('/', require(`../routes/${resource}`));

  let server;
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run((path, init) => fetch(base + path, init));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

function postJson(body) {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

test('containsBsonTypeKey finds the key at any depth', () => {
  assert.equal(utils.containsBsonTypeKey({ a: 1, b: ['x'] }), false);
  assert.equal(utils.containsBsonTypeKey({ _bsontype: 'MinKey' }), true);
  assert.equal(utils.containsBsonTypeKey({ owner: { _bsontype: 'Code', code: 'x' } }), true);
  assert.equal(utils.containsBsonTypeKey({ $or: [{ a: { _bsontype: 'MaxKey' } }] }), true);
  assert.equal(utils.containsBsonTypeKey(undefined), false);
});

test('isAcceptableQuery only takes plain, code-free, type-free objects', () => {
  assert.equal(utils.isAcceptableQuery({ nlikes: { $lt: 15 } }), true);
  assert.equal(utils.isAcceptableQuery({ $expr: { $gt: ['$a', '$b'] } }), true);
  assert.equal(utils.isAcceptableQuery(5), false);
  assert.equal(utils.isAcceptableQuery('x'), false);
  assert.equal(utils.isAcceptableQuery(null), false);
  assert.equal(utils.isAcceptableQuery([{}]), false);
  assert.equal(utils.isAcceptableQuery({ $where: 'true' }), false);
  assert.equal(utils.isAcceptableQuery({ a: { _bsontype: 'MinKey' } }), false);
});

for (const resource of ['user', 'games']) {
  test(`${resource}/list answers 400, without querying, for a q that is not a filter`, async () => {
    let queried = false;
    const collection = { find(query, callback) { queried = true; callback(null, { each(visit) { visit(null, null); } }); } };

    await withRouter(resource, collection, async request => {
      for (const q of ['5', '"text"', '[{}]', 'null', '{"a":{"_bsontype":"MinKey"}}']) {
        const response = await request('/list?q=' + encodeURIComponent(q));
        assert.equal(response.status, 400, q);
        await response.text();
      }
      assert.equal(queried, false);

      const ok = await request('/list?q=' + encodeURIComponent('{"status":1}'));
      assert.equal(ok.status, 200);
      await ok.text();
    });
  });
}

test('POST /game/:id refuses non-string owner, category, description and tags', async () => {
  let written = false;
  const collection = {
    findOne(query, callback) { callback(null, null); },
    updateOne(filter, update, options, callback) { written = true; callback(null, {}); }
  };
  const valid = { name: 'g', owner: 'u', category: 'c' };

  await withRouter('games', collection, async request => {
    for (const patch of [
      { owner: { $gt: '' } },
      { category: ['a'] },
      { description: { x: 1 } },
      { tags: [{ $ne: null }] },
      { tags: 7 }
    ]) {
      const response = await request('/g1', postJson({ ...valid, ...patch }));
      assert.equal(response.status, 400, JSON.stringify(patch));
      await response.text();
    }
    assert.equal(written, false);
  });
});

test('POST /game/:id stores a single string tag as a one-element list', async () => {
  let stored;
  const collection = {
    findOne(query, callback) { callback(null, null); },
    updateOne(filter, update, options, callback) { stored = update.$set; callback(null, {}); }
  };

  await withRouter('games', collection, async request => {
    const response = await request('/g1', postJson({ name: 'g', owner: 'u', category: 'c', tags: 'retro' }));
    assert.equal(response.status, 200);
    await response.text();
    assert.deepEqual(stored.tags, ['retro']);
  });
});

test('POST /game/:id reports a database failure as a 500, not a 400', async () => {
  const collection = { findOne(query, callback) { callback(new Error('offline')); } };

  await withRouter('games', collection, async request => {
    const response = await request('/g1', postJson({ name: 'g', owner: 'u', category: 'c' }));
    assert.equal(response.status, 500);
    await response.text();
  });
});

test('POST /user answers 409 when the unique index rejects a concurrent duplicate', async () => {
  const collection = {
    findOne(query, callback) { callback(null, null); },
    insertOne(doc, callback) {
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;
      callback(err);
    }
  };

  await withRouter('user', collection, async request => {
    const response = await request('/', postJson({ login: 'ana', name: 'Ana' }));
    assert.equal(response.status, 409);
    await response.text();
  });
});
