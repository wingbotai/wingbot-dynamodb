/*
 * @author Václav Oborník
 */
'use strict';

const {
    DynamoDBClient, PutItemCommand, QueryCommand
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} DynamoDBClientConfig */

/**
 * DynamoDB Chat Log storage
 */
class ChatLogStorage {

    /**
     * @param {string} [tableName]
     * @param {DynamoDBClientConfig} [clientConfig] - preconfigured dynamodb service
     * @param {{error:Function}} [log] - console like logger
     */
    constructor (tableName = 'chatlog', clientConfig = null, log = console) {
        this._documentClient = new DynamoDBClient(clientConfig);

        this._tableName = tableName;

        this._log = log;

        this.muteErrors = true;
    }

    /**
     * Interate history
     * all limits are inclusive
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} [limit]
     * @param {number} [endAt] - iterate backwards to history
     * @param {number} [startAt] - iterate forward to last interaction
     * @returns {Promise<object[]>}
     */
    async getInteractions (senderId, pageId, limit = 10, endAt = null, startAt = null) {

        const orderBackwards = startAt && !endAt;

        const cmd = new QueryCommand({
            TableName: this._tableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': { S: `${pageId || '-'}|${senderId}` }
            },
            ScanIndexForward: !orderBackwards,
            Limit: limit
        });

        if (startAt || endAt) {
            cmd.input.ExpressionAttributeNames = {
                '#timestamp': 'timestamp'
            };
        }

        if (startAt) {
            cmd.input.KeyConditionExpression += ' AND #timestamp >= :startAt';
            Object.assign(cmd.input.ExpressionAttributeValues, {
                ':startAt': { N: `${startAt}` }
            });
        }

        if (endAt) {
            cmd.input.KeyConditionExpression += ' AND #timestamp <= :endAt';
            Object.assign(cmd.input.ExpressionAttributeValues, {
                ':endAt': { N: `${endAt}` }
            });
        }

        const res = await this._documentClient.send(cmd);

        const data = res.Items.map((i) => {
            const { userId, ...rest } = unmarshall(i);
            return rest;
        });

        if (orderBackwards) {
            data.reverse();
        }

        return data;
    }

    /**
     * Log single event
     *
     * @param {string} senderId
     * @param {object[]} responses - list of sent responses
     * @param {object} request - event request
     * @param {object} [metadata] - request metadata
     * @returns {Promise}
     */
    log (senderId, responses = [], request = {}, metadata = {}) {
        const log = {
            senderId,
            request,
            responses,
            ...metadata
        };

        return this._storeLog(log);
    }

    async _storeLog (event) {
        const timestamp = event.timestamp || event.request.timestamp || Date.now();
        const pageId = event.pageId || '-';

        const log = {
            ...event,
            userId: `${pageId}|${event.senderId}`,
            timestamp,
            time: new Date(timestamp || Date.now()).toISOString(),
            pageId
        };

        const put = new PutItemCommand({
            TableName: this._tableName,
            Item: marshall(log)
        });

        try {
            await this._documentClient.send(put);
        } catch (e) {
            this._log.error('Failed to store chat log', e, log);

            if (!this.muteErrors) {
                throw e;
            }
        }
    }

    /**
     * Log single event
     *
     * @method
     * @name ChatLog#error
     * @param {any} err - error
     * @param {string} senderId
     * @param {object[]} [responses] - list of sent responses
     * @param {object} [request] - event request
     * @param {object} [metadata] - request metadata
     * @returns {Promise}
     */
    error (err, senderId, responses = [], request = {}, metadata = {}) {
        const log = {
            senderId,
            request,
            responses,
            err: `${err}`,
            ...metadata
        };

        Object.assign(log, metadata);

        return this._storeLog(log);
    }

}

module.exports = ChatLogStorage;
