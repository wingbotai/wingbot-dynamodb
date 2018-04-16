/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const BotTokenStorage = require('../src/BotTokenStorage');
const {
    createTableIfNotExists,
    dropTable,
    db
} = require('./utils');

const TABLE_NAME = 'test-bottokens';
const INDEX_NAME = 'token';

const SENDER_ID = 'hello';
const SENDER_ID2 = 'hello2';


describe('<BotTokenStorage>', function () {

    before(async () => {
        await createTableIfNotExists({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: 'senderId',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'token',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'senderId',
                    KeyType: 'HASH'
                }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: INDEX_NAME,
                    KeySchema: [
                        {
                            AttributeName: 'token',
                            KeyType: 'HASH'
                        }
                    ],
                    Projection: {
                        ProjectionType: 'ALL'
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
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

    describe('#getOrCreateToken()', () => {

        it('creates token', async () => {
            const bts = new BotTokenStorage(TABLE_NAME, INDEX_NAME, db);

            let token = await bts.getOrCreateToken(SENDER_ID, () => Promise.resolve('randomToken'));

            assert.deepStrictEqual(token, {
                token: 'randomToken',
                senderId: SENDER_ID
            });

            token = await bts.getOrCreateToken(SENDER_ID, () => Promise.resolve('nothing'));

            assert.deepStrictEqual(token, {
                token: 'randomToken',
                senderId: SENDER_ID
            });
        });

        it('avoids collisions', async () => {
            const bts = new BotTokenStorage(TABLE_NAME, INDEX_NAME, db);

            const tokens = await Promise.all([
                bts.getOrCreateToken('a', () => Promise.resolve('fake')),
                bts.getOrCreateToken('a', () => Promise.resolve('another'))
            ]);

            assert.ok(tokens.every(t => t.senderId === 'a'
                && (t.token === 'fake' || t.token === 'another')));
        });

    });

    describe('#findByToken()', () => {

        it('is able to find token', async () => {
            const bts = new BotTokenStorage(TABLE_NAME, INDEX_NAME, db);

            let token = await bts.findByToken('nonexisting');

            assert.strictEqual(token, null);

            await bts.getOrCreateToken(SENDER_ID2, () => Promise.resolve('lookForToken'));

            token = await bts.findByToken('lookForToken');

            assert.deepStrictEqual(token, {
                token: 'lookForToken',
                senderId: SENDER_ID2
            });
        });

        it('no token returns null response', async () => {
            const bts = new BotTokenStorage();

            const token = await bts.findByToken('');

            assert.strictEqual(token, null);
        });

    });

});
