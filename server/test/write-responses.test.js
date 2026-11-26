'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bodyParser = require('body-parser');

// What driver 3.x hands the updateOne callback: the counts, the server's raw
// reply (on a replica set with $clusterTime and opTime in it) and the
// connection the write went over.
function driverWriteResult () {
  return {
    result: {
      n: 1, nModified: 1, ok: 1,
      opTime: { ts: 1, t: 1 },
      $clusterTime: { clusterTime: 1, signature: { hash: 'h', keyId: 7 } },
    },
    connection: { id: 3, address: '10.0.3.7:27017', host: '10.0.3.7', port: 27017 },
    matchedCount: 1,
    modifiedCount: 1,
    upsertedCount: 0,
    upsertedId: null,
  };
}

// A stub database: findOne answers with the game for the plain lookup and
// with `liked` for the lookup that includes the user; updateOne succeeds.
async function withServer (liked, fn) {
  const game = { guid: 'g1', name: 'n', nlikes: 1, ulike: [] };
  const app = express();
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.db = { collection: () => ({
      findOne (query, callback) {
        callback(null, 'ulike.uid' in query ? (liked ? game : null) : game);
      },
      updateOne (filter, doc, options, callback) { callback(null, driverWriteResult()); },
    }) };
    next();
  });
  app.use('/', require('../routes/games'));
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

for (const [label, path, method, liked] of [
  ['DELETE /:id', '/g1', 'DELETE', false],
  ['POST /:game/like', '/g1/like', 'POST', false],
  ['POST /:game/unlike', '/g1/unlike', 'POST', true],
]) {
  test(`games: ${label} answers with the counts and not the driver's connection`, () =>
    withServer(liked, async (base) => {
      const response = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ user: 'u1' }) : undefined,
      });
      assert.equal(response.status, 200);
      const raw = await response.text();
      assert.doesNotMatch(raw, /10\.0\.3\.7|27017|connection|clusterTime|opTime/);

      const body = JSON.parse(raw);
      // The names a client could read before, at both levels.
      assert.deepEqual(body.result, { n: 1, nModified: 1, ok: 1 });
      assert.equal(body.ok, 1);
      assert.equal(body.nModified, 1);
      assert.equal(body.matchedCount, 1);
      assert.equal(body.modifiedCount, 1);
      assert.equal(body.upsertedCount, 0);
      assert.equal(body.upsertedId, null);
    }));
}
