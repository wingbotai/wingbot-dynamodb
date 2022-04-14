/*
 * @author Václav Oborník
 */
'use strict';

const {
    DynamoDBClient, PutItemCommand
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

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
     * Log single event
     *
     * @param {string} userId
     * @param {object[]} responses - list of sent responses
     * @param {object} request - event request
     * @returns {Promise}
     */
    async log (userId, responses = [], request = {}) {
        const log = {
            userId,
            time: new Date(request.timestamp || Date.now()).toISOString(),
            request,
            responses
        };

        const put = new PutItemCommand({
            TableName: this._tableName,
            Item: marshall(log)
        });

        try {
            await this._documentClient.send(put);
        } catch (err) {
            this._log.error('Failed to store chat log', err, log);

            if (!this.muteErrors) {
                throw err;
            }
        }
    }

    /**
     * Log single event
     *
     * @method
     * @name ChatLog#error
     * @param {any} err - error
     * @param {string} userId
     * @param {object[]} [responses] - list of sent responses
     * @param {object} [request] - event request
     * @returns {Promise}
     */
    async error (err, userId, responses = [], request = {}) {
        const log = {
            userId,
            time: new Date(request.timestamp || Date.now()).toISOString(),
            request,
            responses,
            err: `${err}`
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

}

module.exports = ChatLogStorage;
