/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const AttachmentCache = require('../src/AttachmentCache');
const {
    createTableIfNotExists,
    dropTable,
    dbConfig
} = require('./utils');

const TABLE_NAME = 'test-attachment-storage';
const TEST_URL = 'abc';

describe('<AttachmentCache>', function () {

    before(async function () {
        this.timeout(8000);
        await createTableIfNotExists({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: 'url',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'url',
                    KeyType: 'HASH'
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        });
    });

    after(async () => {
        await dropTable(TABLE_NAME);
    });

    it('should be able to store and fetch the cached item', async () => {

        const attachmentCache = new AttachmentCache(TABLE_NAME, dbConfig);

        const nothing = await attachmentCache.findAttachmentByUrl(TEST_URL);

        assert.strictEqual(nothing, null);

        // save to cache
        await attachmentCache.saveAttachmentId(TEST_URL, 1);

        const something = await attachmentCache.findAttachmentByUrl(TEST_URL);

        assert.strictEqual(something, 1);
    });

});
