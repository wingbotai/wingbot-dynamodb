/*
 * @author David Menger
 */
'use strict';

const {
    createTableIfNotExists,
    dropTable,
    dbConfig
} = require('./utils');
const BaseStorage = require('../src/BaseStorage');

const TABLE_NAME = 'base-storage-test';

describe('<StateStorage>', function () {

    before(async function () {
        this.timeout(8000);
        await createTableIfNotExists({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: 'bid',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'eid',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'brn',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'bid',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'eid',
                    KeyType: 'RANGE'
                }
            ],
            LocalSecondaryIndexes: [
                {
                    IndexName: 'BrandIndex',
                    KeySchema: [
                        { AttributeName: 'bid', KeyType: 'HASH' },
                        { AttributeName: 'brn', KeyType: 'RANGE' }
                    ],
                    Projection: {
                        ProjectionType: 'KEYS_ONLY'
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

    describe('#client()', () => {

        it('creates state and locks it', async () => {
            const ss = new BaseStorage(TABLE_NAME, dbConfig);

            const items = [{
                PutRequest: {
                    Item: {
                        bid: 'bid',
                        eid: 'eid'
                        // brn: 'x'
                    }
                }
            }];

            const cmd = new ss._lib.BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: items
                }
            });

            await ss._documentClient.send(cmd);
        });

        it('does some upsert', async () => {
            const ss = new BaseStorage(TABLE_NAME, dbConfig);

            const cmd = new ss._lib.UpdateCommand({
                TableName: TABLE_NAME,
                Key: { bid: 'x', eid: 'y' },
                UpdateExpression: 'SET z = :z DELETE something :rem',
                ExpressionAttributeValues: {
                    ':z': 'z',
                    // ':something': new Set([1]),
                    ':rem': new Set([2])
                },
                ReturnValues: 'NONE'
            });

            await ss._documentClient.send(cmd);

            const fetch = new ss._lib.GetCommand({
                TableName: TABLE_NAME,
                Key: { bid: 'x', eid: 'y' }
            });

            await ss._documentClient.send(fetch);
        });

    });

});
