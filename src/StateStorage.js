/*
 * @author Václav Oborník
 */
'use strict';

const AWS = require('aws-sdk');
const deepMap = require('./deepMap');

const ISODatePattern = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;


/**
 * Conversation state DynamoDB storage
 */
class DynamoStateStorage {

    /**
     * @param {string} [tableName]
     * @param {AWS.DynamoDB} [dynamoDbService] - preconfigured dynamodb service
     */
    constructor (tableName = 'states', dynamoDbService) {
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
     *
     * @param {any} senderId - sender identifier
     * @param {Object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<Object>} - conversation state
     */
    getOrCreateAndLock (senderId, defaultState = {}, timeout = 300) {
        const now = Date.now();

        return this._documentClient.update({
            TableName: this._tableName,
            Key: { senderId },
            ExpressionAttributeNames: {
                '#LOCK': 'lock'
            },
            UpdateExpression: 'SET #LOCK = :now',
            ConditionExpression: 'attribute_not_exists(senderId) OR (#LOCK < :lockTime)',
            ExpressionAttributeValues: {
                ':now': now,
                ':lockTime': now - timeout
            },
            ReturnValues: 'ALL_NEW'
        })
            .promise()
            .then((data) => {

                let state = data.Attributes;
                if (!state.state) {
                    state.state = defaultState;
                }

                state = this._decodeState(state);

                return state;
            })
            .catch((e) => {
                if (e.code === 'ConditionalCheckFailedException') {
                    Object.assign(e, { code: 11000 });
                }
                throw e;
            });
    }

    _decodeState (state) {
        return deepMap(state, (value) => {
            if (typeof value === 'string' && ISODatePattern.test(value)) {
                return new Date(value);
            }
            return value;
        });
    }

    _encodeState (state) {
        return deepMap(state, (value) => {
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        });
    }

    /**
     *
     * @param {Object} state - conversation state
     * @returns {Promise<Object>}
     */
    saveState (state) {
        Object.assign(state, {
            lock: 0
        });

        const stateToSave = this._encodeState(state);

        return this._documentClient.put({
            TableName: this._tableName,
            Item: stateToSave
        })
            .promise()
            .then(() => state);
    }

}

module.exports = DynamoStateStorage;
