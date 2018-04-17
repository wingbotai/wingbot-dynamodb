/*
 * @author Václav Oborník
 */
'use strict';

const AWS = require('aws-sdk');


/**
 * DynamoDB Chat Log storage
 */
class DynamoChatLog {

    /**
     * @param {string} [tableName]
     * @param {AWS.DynamoDB} [dynamoDbService] - preconfigured dynamodb service
     * @param {{error:Function}} [log] - console like logger
     */
    constructor (tableName = 'chatlog', dynamoDbService = null, log = console) {
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

        this._log = log;

        this.muteErrors = true;
    }


    /**
     * Log single event
     *
     * @param {string} userId
     * @param {Object[]} responses - list of sent responses
     * @param {Object} request - event request
     */
    log (userId, responses = [], request = {}) {
        const log = {
            userId,
            time: new Date(request.timestamp || Date.now()).toISOString(),
            request,
            responses
        };

        return this._documentClient.put({
            TableName: this._tableName,
            Item: log
        }).promise()
            .catch((err) => {
                this._log.error('Failed to store chat log', err, log);

                if (!this.muteErrors) {
                    throw err;
                }
            });
    }

    /**
     * Log single event
     *
     * @method
     * @name ChatLog#error
     * @param {any} err - error
     * @param {string} userId
     * @param {Object[]} [responses] - list of sent responses
     * @param {Object} [request] - event request
     */
    error (err, userId, responses = [], request = {}) {
        const log = {
            userId,
            time: new Date(request.timestamp || Date.now()).toISOString(),
            request,
            responses,
            err: `${err}`
        };

        this._documentClient.put({
            TableName: this._tableName,
            Item: log
        }).promise()
            .catch((storeError) => {
                this._log.error('Failed to store chat log', storeError, log);

                if (!this.muteErrors) {
                    throw storeError;
                }
            });
    }

}

module.exports = DynamoChatLog;
