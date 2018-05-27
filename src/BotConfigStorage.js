/*
 * @author David Menger
 */
'use strict';

const AWS = require('aws-sdk');

const CONFIG_ID = 'config';

/**
 * Storage for wingbot.ai conversation config
 *
 * @class
 */
class BotConfigStorage {

    /**
     * @param {string} [tableName] - the table name
     * @param {AWS.DynamoDB} [dynamoDbService] - preconfigured dynamodb service
     */
    constructor (tableName = 'wingbot-config', dynamoDbService = null) {
        const clientConfig = {
            convertEmptyValues: true
        };

        if (dynamoDbService) {
            Object.assign(clientConfig, {
                service: dynamoDbService
            });
        }

        this._documentClient = new AWS.DynamoDB.DocumentClient(clientConfig);

        this._tableName = tableName;
    }

    /**
     * Invalidates current configuration
     *
     * @returns {Promise}
     */
    invalidateConfig () {
        return this._documentClient.delete({
            TableName: this._tableName,
            Key: {
                k: CONFIG_ID
            }
        }).promise();
    }

    /**
     * @returns {Promise<number>}
     */
    async getConfigTimestamp () {
        const data = await this._documentClient.get({
            TableName: this._tableName,
            Key: {
                k: CONFIG_ID
            },
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ProjectionExpression: '#timestamp'
        }).promise();

        return data.Item ? data.Item.timestamp : 0;
    }

    /**
     * @template T
     * @param {T} newConfig
     * @returns {Promise<T>}
     */
    async updateConfig (newConfig) {
        Object.assign(newConfig, { timestamp: Date.now(), k: CONFIG_ID });
        const store = Object.assign({}, newConfig);

        await this._documentClient.put({
            TableName: this._tableName,
            Item: store
        }).promise();

        return newConfig;
    }

    /**
     * @returns {Promise<Object|null>}
     */
    async getConfig () {
        const data = await this._documentClient.get({
            TableName: this._tableName,
            Key: {
                k: CONFIG_ID
            }
        }).promise();

        return data.Item || null;
    }

}

module.exports = BotConfigStorage;
