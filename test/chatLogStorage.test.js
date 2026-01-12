/*
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const ChatLogStorage = require('../src/ChatLogStorage');
const {
    createTableIfNotExists,
    dropTable,
    dbConfig
} = require('./utils');

const TABLE_NAME = 'test-chatlogs';

describe('<ChatLogStorage>', function () {

    const SENDER_ID = `hello${Date.now()}`;

    /** @type {ChatLogStorage} */
    let chl;

    before(async function () {
        this.timeout(8000);
        await createTableIfNotExists({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: 'userId',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'timestamp',
                    AttributeType: 'N'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'userId',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'timestamp',
                    KeyType: 'RANGE'
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        });
    });

    beforeEach(() => {
        chl = new ChatLogStorage(TABLE_NAME, dbConfig);
    });

    after(async () => {
        await dropTable(TABLE_NAME);
    });

    describe('#log()', () => {

        it('stores data without error', async () => {
            chl.muteErrors = false;

            await chl.log(SENDER_ID, [{ response: 1 }], { req: 1 });
        });

        it('mutes errors', async () => {
            await chl.log(SENDER_ID);
        });

    });

    describe('#getInteractions()', () => {

        it('should return stored interactions', async () => {
            const timestamp = Date.now();
            const zeroTs = timestamp - 2002;
            const firstTs = timestamp - 1001;
            await chl.log('abc', [{ response: 0 }], { req: 0 }, { pageId: '2', timestamp: zeroTs });
            await chl.log('abc', [{ response: 1 }], { req: 1 }, { pageId: '2', timestamp: firstTs });
            await chl.log('abc', [{ response: 2 }], { req: 2 }, { pageId: '2', timestamp });

            let data = await chl.getInteractions('abc', '2', 2);

            assert.deepEqual(data, [
                {
                    pageId: '2',
                    request: {
                        req: 1
                    },
                    responses: [
                        {
                            response: 1
                        }
                    ],
                    senderId: 'abc',
                    timestamp: firstTs,
                    time: `${new Date(firstTs).toISOString()}`
                },
                {
                    pageId: '2',
                    request: {
                        req: 2
                    },
                    responses: [
                        {
                            response: 2
                        }
                    ],
                    senderId: 'abc',
                    timestamp,
                    time: `${new Date(timestamp).toISOString()}`
                }
            ]);

            data = await chl.getInteractions('abc', '2', 1, firstTs);

            assert.deepEqual(data, [
                {
                    pageId: '2',
                    request: {
                        req: 1
                    },
                    responses: [
                        {
                            response: 1
                        }
                    ],
                    senderId: 'abc',
                    timestamp: firstTs,
                    time: `${new Date(firstTs).toISOString()}`
                }
            ]);

            data = await chl.getInteractions('abc', '2', 2, null, firstTs);

            assert.deepEqual(data, [
                {
                    pageId: '2',
                    request: {
                        req: 1
                    },
                    responses: [
                        {
                            response: 1
                        }
                    ],
                    senderId: 'abc',
                    timestamp: firstTs,
                    time: `${new Date(firstTs).toISOString()}`
                },
                {
                    pageId: '2',
                    request: {
                        req: 2
                    },
                    responses: [
                        {
                            response: 2
                        }
                    ],
                    senderId: 'abc',
                    timestamp,
                    time: `${new Date(timestamp).toISOString()}`
                }
            ]);
        });

    });

    describe('#error()', () => {

        it('stores error without fail', async () => {
            chl.muteErrors = false;

            await chl.error(new Error('something failed'), SENDER_ID, [{ response: 1 }], { req: 1 });
        });

        it('mutes errors', async () => {
            await chl.error(new Error('something failed'), SENDER_ID);
        });

    });

});
