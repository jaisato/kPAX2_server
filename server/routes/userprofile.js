var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

const debug = require('debug')('app:userprofile');
const USER_COLLECTION = 'userprofile';

/**
 * Get user profile (by Id of the user)
 * parameter: id
 * GET /userprofile/:id
 *
 * http://localhost:8081/userprofile/57546d42ff435e591d083d04
 */
router.get('/:id', function (req, res) {
    var userId = req.params.id;
    getUser(req, res, userId);
});


/**
 * list users under a FREE condition
 * if no parameter passed, all users ar listed
 * the 'q' query must be a valid JSON query condition in MongoBD format
 * endpoint method: GET
 * example : /userprofile?q={"name":"Roger"}
 */
router.get('/', function (req, res) {
    var userQuery = getQuery(req);
    getUsers(req, res, userQuery);
});

function getQuery(req) {
    var userQuery = {};
    if (req.query.q) {
        try {
            userQuery = JSON.parse(req.query.q);
        }
        catch (e) {
            debug(' Bad JSON format, NO Query Done!: NO records listed');
            userQuery = {_id: null};
        }
    }
    return userQuery;
}

function getUser(req, res, userId) {
    req.db.collection(USER_COLLECTION).findOne(
        {_id: new ObjectId(userId)},
        function (err, doc) {
            // if error, return 500
            if (err) return res.status(500).send('Error when userprofile.findOne ' + err.message);

            // User not found
            if (!doc) return res.status(404).send('Not found');

            debug(doc);
            res.jsonp(doc);
        }
    );
}

function getUsers(req, res, userQuery) {
    req.db.collection(USER_COLLECTION).find(
        userQuery,
        function (err, cursor) {
            // if error, return 500
            if (err) return res.status(500).send('Error when db.find ' + err.message);

            // walk the cursor
            var users = [];
            cursor.each(function (err, doc) {

                if (doc === null) {
                    debug(users);
                    return res.jsonp(users);
                }

                users.push(doc);
            });
        }
    );
}

module.exports = router;
