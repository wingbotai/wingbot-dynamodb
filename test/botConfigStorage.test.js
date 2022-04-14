/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const BotConfigStorage = require('../src/BotConfigStorage');
const {
    createTableIfNotExists,
    dropTable,
    dbConfig
} = require('./utils');

const TABLE_NAME = 'test-botconfig';

describe('<BotConfigStorage>', function () {

    before(async function () {
        this.timeout(8000);
        await createTableIfNotExists({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: 'k',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'k',
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

    it('has api', async () => {
        const botConfigStorage = new BotConfigStorage(TABLE_NAME, dbConfig);

        const api = botConfigStorage.api();

        assert.equal(typeof api.updateBot, 'function');

        const res = await api.updateBot({}, { groups: ['a'], token: { groups: [{ group: 'a' }] } });

        assert.strictEqual(res, true);

        const res2 = await api.updateBot({}, { groups: ['b'], token: { groups: [{ group: 'a' }] } });

        assert.strictEqual(res2, null);
    });

    it('should be able to store and fetch, invalidate and update config under same timestamp', async () => {
        const cfgObj = { blocks: 123 };

        const botConfigStorage = new BotConfigStorage(TABLE_NAME, dbConfig);

        // save config
        const savedConfig = await botConfigStorage.updateConfig(cfgObj);

        assert.strictEqual(savedConfig.blocks, cfgObj.blocks);

        // check for config timestamp
        const ts = await botConfigStorage.getConfigTimestamp();

        assert.strictEqual(ts, savedConfig.timestamp);

        // load config
        const loadedConfig = await botConfigStorage.getConfig();

        assert.deepStrictEqual(loadedConfig, savedConfig);

        // invalidate config
        await botConfigStorage.invalidateConfig();

        const emptyTs = await botConfigStorage.getConfigTimestamp();
        const emptyConfig = await botConfigStorage.getConfig();

        assert.strictEqual(emptyTs, 0);
        assert.strictEqual(emptyConfig, null);
    });

});
