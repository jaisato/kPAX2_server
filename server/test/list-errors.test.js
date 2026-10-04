'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

for (const resource of ['user', 'games']) {
  for (const mode of ['empty', 'documents', 'cursor-error', 'find-error']) {
    test(`${resource}: ${mode}`, async () => {
      const app = express();
      const document = { guid: 'test-id', name: 'test' };
      app.use((req, res, next) => {
        req.db = { collection: () => ({ find(query, callback) {
          if (mode === 'find-error') return callback(new Error('offline'));
          callback(null, { each(visit) {
            if (mode !== 'empty') visit(null, document);
            if (mode === 'cursor-error') return visit(new Error('cursor interrupted'), null);
            visit(null, null);
          }});
        }}) };
        next();
      });
      app.use('/', require(`../routes/${resource}`));
      let server;
      await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
      try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/list`);
        if (mode.endsWith('error')) {
          assert.equal(response.status, 500, 'a failed query must never return partial success');
          await response.text();
        } else {
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), mode === 'empty' ? [] : [document]);
        }
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  }
}
