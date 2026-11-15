'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bodyParser = require('body-parser');

// POST /user with a stub collection that only has the methods of the current
// driver API: insert() is deprecated in 3.x and gone in 4.x.
test('user: POST / creates the user with insertOne', async () => {
  const app = express();
  app.use(bodyParser.json());
  let inserted;
  app.use((req, res, next) => {
    req.db = { collection: () => ({
      findOne(query, callback) { callback(null, null); },
      insertOne(doc, callback) { inserted = doc; callback(null, { insertedCount: 1 }); },
    }) };
    next();
  });
  app.use('/', require('../routes/user'));
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'ana', name: 'Ana', admin: true }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(inserted.login, 'ana');
    assert.equal(inserted.name, 'Ana');
    assert.equal(inserted.status, 1);
    // only the wanted fields are stored
    assert.equal('admin' in inserted, false);
    assert.equal(body.login, 'ana');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
