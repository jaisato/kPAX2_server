'use strict';
// GET /game/list and /user/list take a Mongo filter as JSON in ?q=. Only a
// plain object is a filter. JSON.parse() also returns null, numbers, strings,
// booleans and arrays: driver 3.x turns a null selector into {} (?q=null
// listed the whole collection), throws on the other scalars (a 500) and the
// server rejects an array (another 500). They are all a 400 before find().
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const document = { guid: 'test-id', name: 'test' };

async function list(resource, q) {
  const app = express();
  const queries = [];
  app.use((req, res, next) => {
    req.db = { collection: () => ({ find(query, callback) {
      queries.push(query);
      callback(null, { each(visit) {
        visit(null, document);
        visit(null, null);
      }});
    }}) };
    next();
  });
  app.use('/', require(`../routes/${resource}`));
  let server;
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  try {
    const url = new URL(`http://127.0.0.1:${server.address().port}/list`);
    if (q !== undefined) url.searchParams.set('q', q);
    const response = await fetch(url);
    return { status: response.status, body: await response.text(), queries };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

for (const resource of ['user', 'games']) {
  for (const q of ['5', '"test"', 'true', 'null', '[{"name":"test"}]']) {
    test(`${resource}: q=${q} is not a filter and is refused`, async () => {
      const { status, queries } = await list(resource, q);
      assert.equal(status, 400);
      assert.deepEqual(queries, [], 'the query must not reach the database');
    });
  }

  test(`${resource}: code-executing operators are refused, also nested`, async () => {
    const { status, queries } = await list(resource, '{"$or":[{"$where":"sleep(1000)"}]}');
    assert.equal(status, 400);
    assert.deepEqual(queries, []);
  });

  test(`${resource}: an object filter reaches find() unchanged`, async () => {
    const { status, body, queries } = await list(resource, '{"nlikes":{"$lt":15}}');
    assert.equal(status, 200);
    assert.deepEqual(JSON.parse(body), [document]);
    assert.deepEqual(queries, [{ nlikes: { $lt: 15 } }]);
  });

  test(`${resource}: no q lists everything and invalid JSON lists nothing`, async () => {
    assert.deepEqual((await list(resource)).queries, [{}]);
    assert.deepEqual((await list(resource, '{not json')).queries, [{ _id: null }]);
  });
}
