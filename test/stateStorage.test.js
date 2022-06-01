/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const StateStorage = require('../src/StateStorage');
const {
    createTableIfNotExists,
    dropTable,
    dbConfig
} = require('./utils');

const TABLE_NAME = 'test-states';
const SENDER_ID = 'hello';
const SENDER_ID2 = 'hello2';
const PAGE_ID = 'page_id';

describe('<StateStorage>', function () {

    before(async function () {
        this.timeout(8000);
        await createTableIfNotExists({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: 'senderId',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'pageId',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'lastInteraction',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'pageId',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'senderId',
                    KeyType: 'RANGE'
                }
            ],
            LocalSecondaryIndexes: [
                {
                    IndexName: 'lastInteraction',
                    KeySchema: [
                        {
                            AttributeName: 'pageId',
                            KeyType: 'HASH'
                        },
                        {
                            AttributeName: 'lastInteraction',
                            KeyType: 'RANGE'
                        }
                    ],
                    Projection: {
                        ProjectionType: 'INCLUDE',
                        NonKeyAttributes: ['senderId']
                    }
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

    describe('#getOrCreateAndLock()', () => {

        it('creates state and locks it', async () => {
            const ss = new StateStorage(TABLE_NAME, dbConfig);

            const first = await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 500);

            let thrownError = null;

            try {
                await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 500);
            } catch (e) {
                thrownError = e;
            }

            assert.ok(thrownError !== null);
            assert.strictEqual(thrownError.code, 11000);

            await ss.saveState({ ...first });
        });

    });

    describe('#getState()', () => {

        it('returns zero state', async () => {
            const ss = new StateStorage(TABLE_NAME, dbConfig);

            const nonexisting = await ss.getState('nonexisting', 'random');

            assert.strictEqual(nonexisting, null);

            await ss.getOrCreateAndLock('x', PAGE_ID, {}, 500);

            const existing = await ss.getState('x', PAGE_ID);

            assert.strictEqual(typeof existing, 'object');
            assert.strictEqual(existing.senderId, 'x');
            assert.strictEqual(existing.pageId, PAGE_ID);
            assert.deepStrictEqual(existing.state, {});
        });

    });

    describe('#saveState()', () => {

        it('is able to recover state from db and encodes dates', async () => {
            const ss = new StateStorage(TABLE_NAME, dbConfig);

            const now = new Date();

            const state = {
                dateTest: now,
                foo: 'bar',
                listTest: [
                    { d: 1 },
                    { d: 2 },
                    { d: now }
                ]
            };

            await ss.saveState({
                senderId: SENDER_ID2,
                pageId: PAGE_ID,
                state,
                lock: 0,
                some: 123
            });

            const savedState = await ss.getOrCreateAndLock(SENDER_ID2, PAGE_ID, {}, 100);

            assert.deepStrictEqual(savedState.state, {
                dateTest: now,
                foo: 'bar',
                listTest: [
                    { d: 1 },
                    { d: 2 },
                    { d: now }
                ]
            });

            await ss.saveState({ ...savedState });
        });

    });

    describe('#getStates()', () => {

        /** @type {StateStorage} */
        let storage;
        const secondState = { x: 2 };
        const firstState = { x: 1 };
        const lastInteraction = new Date(Date.now() - 2000);
        const lastInteraction2 = new Date(Date.now() - 1000);

        beforeEach(async () => {
            storage = new StateStorage(TABLE_NAME, dbConfig, PAGE_ID);

            const first = await storage.getOrCreateAndLock(SENDER_ID, PAGE_ID, firstState);
            const second = await storage.getOrCreateAndLock(SENDER_ID2, PAGE_ID, secondState);

            await storage.saveState({ ...first, lastInteraction });
            await storage.saveState({ ...second, lastInteraction: lastInteraction2 });
        });

        it('should return states by last interaction', async () => {
            let { data, lastKey } = await storage.getStates({}, 1);

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID2,
                lastInteraction: lastInteraction2
            }]);

            ({ data, lastKey } = await storage.getStates({}, 1, lastKey));

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID,
                lastInteraction
            }]);

            assert.strictEqual(lastKey, null);
        });

        it('should be able to use search', async () => {
            const { data, lastKey } = await storage.getStates({
                search: SENDER_ID2
            });

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID2,
                lastInteraction: lastInteraction2
            }]);

            assert.strictEqual(lastKey, null);
        });

    });

});
