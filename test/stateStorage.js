/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const StateStorage = require('../src/StateStorage');
const {
    createTableIfNotExists,
    dropTable,
    db
} = require('./utils');

const TABLE_NAME = 'test-states';
const SENDER_ID = 'hello';
const SENDER_ID2 = 'hello2';
const PAGE_ID = 'page_id';


describe('<StateStorage>', function () {

    before(async () => {
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
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'senderId',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'pageId',
                    KeyType: 'RANGE'
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
            const ss = new StateStorage(TABLE_NAME, db);

            await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 100);

            let thrownError = null;

            try {
                await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 100);
            } catch (e) {
                thrownError = e;
            }

            assert.ok(thrownError !== null);
            assert.strictEqual(thrownError.code, 11000);
        });

    });

    describe('#getState()', () => {

        it('returns zero state', async () => {
            const ss = new StateStorage(TABLE_NAME, db);

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
            const ss = new StateStorage(TABLE_NAME, db);

            const state = {
                dateTest: new Date(),
                listTest: [
                    { d: 1 },
                    { d: 2 },
                    { d: new Date() }
                ]
            };

            await ss.saveState({
                senderId: SENDER_ID2,
                pageId: PAGE_ID,
                state,
                lock: 0
            });

            const savedState = await ss.getOrCreateAndLock(SENDER_ID2, PAGE_ID, {}, 100);

            assert.deepStrictEqual(savedState.state, state);
        });

    });

});
