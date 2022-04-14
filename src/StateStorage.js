/*
 * @author Václav Oborník
 */
'use strict';

const {
    DynamoDBClient, UpdateItemCommand, GetItemCommand, PutItemCommand,
    ConditionalCheckFailedException
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { deepDecode, deepEncode } = require('./deepEncode');

/**
 * @typedef {object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {object} state
 */

/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} DynamoDBClientConfig */

/**
 * Conversation state DynamoDB storage
 */
class StateStorage {

    /**
     * @param {string} [tableName]
     * @param {DynamoDBClientConfig} [clientConfig] - preconfigured dynamodb service
     */
    constructor (tableName = 'states', clientConfig = {}) {
        this._documentClient = new DynamoDBClient(clientConfig);

        this._tableName = tableName;
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<State|null>}
     */
    async getState (senderId, pageId) {
        const get = new GetItemCommand({
            TableName: this._tableName,
            Key: { pageId: { S: pageId }, senderId: { S: senderId } }
        });

        const data = await this._documentClient.send(get);

        if (!data.Item) {
            return null;
        }
        const ret = deepDecode(unmarshall(data.Item));
        if (typeof ret.state !== 'object') {
            Object.assign(ret, { state: {} });
        }
        return ret;
    }

    /**
     *
     * @param {string} senderId - sender identifier
     * @param {string} pageId - page/channel identifier
     * @param {object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<object>} - conversation state
     */
    async getOrCreateAndLock (senderId, pageId, defaultState = {}, timeout = 300) {
        const now = Date.now();

        const update = new UpdateItemCommand({
            TableName: this._tableName,
            Key: { pageId: { S: pageId }, senderId: { S: senderId } },
            ExpressionAttributeNames: {
                '#LOCK': 'lock'
            },
            UpdateExpression: 'SET #LOCK = :now',
            ConditionExpression: 'attribute_not_exists(senderId) OR (#LOCK < :lockTime)',
            ExpressionAttributeValues: {
                ':now': { N: now.toString() },
                ':lockTime': { N: (now - timeout).toString() }
            },
            ReturnValues: 'ALL_NEW'
        });

        try {
            const data = await this._documentClient.send(update);

            let state = unmarshall(data.Attributes);

            if (!state.state) {
                state.state = defaultState;
            }

            state = deepDecode(state);

            return state;
        } catch (e) {
            if (e instanceof ConditionalCheckFailedException) {
                Object.assign(e, { code: 11000 });
            }
            throw e;
        }
    }

    /**
     *
     * @param {object} state - conversation state
     * @returns {Promise<object>}
     */
    async saveState (state) {
        Object.assign(state, {
            lock: 0
        });

        const stateToSave = marshall(deepEncode(state));

        const put = new PutItemCommand({
            TableName: this._tableName,
            Item: stateToSave
        });

        await this._documentClient.send(put);

        return state;
    }

}

module.exports = StateStorage;
