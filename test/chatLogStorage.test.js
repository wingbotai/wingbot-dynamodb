/*
 * @author David Menger
 */
'use strict';

const ChatLogStorage = require('../src/ChatLogStorage');
const {
    createTableIfNotExists,
    dropTable,
    dbConfig
} = require('./utils');

const TABLE_NAME = 'test-chatlogs';
const SENDER_ID = 'hello';

describe('<ChatLogStorage>', function () {

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
                    AttributeName: 'time',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'userId',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'time',
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

    describe('#log()', () => {

        it('stores data without error', async () => {
            const chl = new ChatLogStorage(TABLE_NAME, dbConfig);
            chl.muteErrors = false;

            await chl.log(SENDER_ID, [{ response: 1 }], { req: 1 });
        });

        it('mutes errors', async () => {
            const chl = new ChatLogStorage(`random-${Math.random().toString().substr(2)}`, dbConfig);

            await chl.log(SENDER_ID);
        });

    });

    describe('#error()', () => {

        it('stores error without fail', async () => {
            const chl = new ChatLogStorage(TABLE_NAME, dbConfig);
            chl.muteErrors = false;

            await chl.error(new Error('something failed'), SENDER_ID, [{ response: 1 }], { req: 1 });
        });

        it('mutes errors', async () => {
            const chl = new ChatLogStorage(`random-${Math.random().toString().substr(2)}`, dbConfig);

            await chl.error(new Error('something failed'), SENDER_ID);
        });

    });

});
