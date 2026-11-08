'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bodyParser = require('body-parser');
// What driver 3.x hands updateOne()'s callback.
const CommandResult = require('mongodb/lib/core/connection/command_result');

const connection = { id: 7, address: '10.0.3.12:27017', host: 'mongo.internal', port: 27017 };

function updateResult() {
  const result = new CommandResult({ ok: 1, n: 1, nModified: 1 }, connection, {});
  result.matchedCount = 1;
  result.modifiedCount = 1;
  result.upsertedId = null;
  result.upsertedCount = 0;
  return result;
}

// findOne answers with the game for the plain lookup and, for the "already
// liked?" lookup, with the game only when `liked` says so.
async function withGamesServer(liked, fn) {
  const app = express();
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.db = { collection: () => ({
      findOne(query, callback) {
        const isLikeLookup = 'ulike.uid' in query;
        callback(null, !isLikeLookup || liked ? { guid: query.guid, name: 'n' } : null);
      },
      updateOne(filter, doc, options, callback) { callback(null, updateResult()); },
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

for (const [label, liked, path, method, body] of [
  ['POST /:game/like', false, '/g1/like', 'POST', { user: 'u1' }],
  ['POST /:game/unlike', true, '/g1/unlike', 'POST', { user: 'u1' }],
  ['DELETE /:id', false, '/g1', 'DELETE', undefined],
]) {
  test(`games: ${label} answers the write counts without the database connection`, () =>
    withGamesServer(liked, async (base) => {
      const response = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body && JSON.stringify(body),
      });
      assert.equal(response.status, 200);
      const text = await response.text();
      assert.doesNotMatch(text, /10\.0\.3\.12|mongo\.internal/);
      const json = JSON.parse(text);
      assert.equal(json.connection, undefined);
      assert.deepEqual(json.result, { ok: 1, n: 1, nModified: 1 });
      assert.equal(json.n, 1);
      assert.equal(json.nModified, 1);
      assert.equal(json.matchedCount, 1);
    }));
}
