/*
 * @author David Menger
 */
'use strict';

const {
    DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { apiAuthorizer } = require('wingbot');

/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} DynamoDBClientConfig */

const CONFIG_ID = 'config';

/**
 * Storage for wingbot.ai conversation config
 *
 * @class
 */
class BotConfigStorage {

    /**
     * @param {string} [tableName] - the table name
     * @param {DynamoDBClientConfig} [clientConfig] - preconfigured dynamodb service
     */
    constructor (tableName = 'wingbot-config', clientConfig = null) {
        this._documentClient = new DynamoDBClient(clientConfig);

        this._tableName = tableName;
    }

    /**
     * Returns botUpdate API for wingbot
     *
     * @param {Function} [onUpdate] - async update handler function
     * @param {Function|string[]} [acl] - acl configuration
     * @returns {{updateBot:Function}}
     */
    api (onUpdate = () => Promise.resolve(), acl = []) {
        const storage = this;
        return {
            async updateBot (args, ctx) {
                if (!apiAuthorizer(args, ctx, acl)) {
                    return null;
                }
                await storage.invalidateConfig();
                await onUpdate();
                return true;
            }
        };
    }

    /**
     * Invalidates current configuration
     *
     * @returns {Promise}
     */
    async invalidateConfig () {
        const del = new DeleteItemCommand({
            TableName: this._tableName,
            Key: {
                k: { S: CONFIG_ID }
            }
        });

        await this._documentClient.send(del);
    }

    /**
     * @returns {Promise<number>}
     */
    async getConfigTimestamp () {
        const get = new GetItemCommand({
            TableName: this._tableName,
            Key: {
                k: { S: CONFIG_ID }
            },
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ProjectionExpression: '#timestamp'
        });
        const data = await this._documentClient.send(get);

        return (data.Item && parseInt(data.Item.timestamp.N, 10)) || 0;
    }

    /**
     * @template T
     * @param {T} newConfig
     * @param {string} [id]
     * @returns {Promise<T>}
     */
    async updateConfig (newConfig, id = CONFIG_ID) {
        Object.assign(newConfig, { timestamp: Date.now() });

        await this.setConfig(id, newConfig);

        return newConfig;
    }

    /**
     *
     * @param {string} id
     * @param {object} newConfig
     */
    async setConfig (id, newConfig) {
        const putCommand = new PutItemCommand({
            TableName: this._tableName,
            Item: marshall({
                k: `${id}`,
                ...newConfig
            })
        });

        await this._documentClient.send(putCommand);

        return newConfig;
    }

    /**
     * @param {string} [id]
     * @returns {Promise<object | null>}
     */
    async getConfig (id = CONFIG_ID) {
        const get = new GetItemCommand({
            TableName: this._tableName,
            Key: {
                k: { S: `${id}` }
            }
        });

        const data = await this._documentClient.send(get);

        if (!data.Item) {
            return null;
        }

        const item = unmarshall(data.Item);

        delete item.k;

        return item;
    }

}

module.exports = BotConfigStorage;
