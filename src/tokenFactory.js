'use strict';

const crypto = require('crypto');

/**
 * @returns {Promise.<string>}
 */
function tokenFactory () {
    return new Promise((res, rej) => {
        crypto.randomBytes(
            255,
            (err, buf) => {
                if (err) {
                    rej(err);
                } else {
                    res(buf.toString('base64'));
                }
            }
        );
    });
}

module.exports = tokenFactory;
