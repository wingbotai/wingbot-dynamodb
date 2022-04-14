/*
 * @author Václav Oborník
 */
'use strict';

const {
    DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const tokenFactory = require('./tokenFactory');

/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} DynamoDBClientConfig */

/**
 * @typedef {object} Token
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {string} token
 */

/**
 * Conversation DynamoDB state storage
 */
class BotTokenStorage {

    /**
     * @param {string} [tableName] - the table name
     * @param {string} [tokensIndexName] - index to query table by token
     * @param {DynamoDBClientConfig} [clientConfig] - preconfigured dynamodb service
     */
    constructor (tableName = 'wingbot-tokens', tokensIndexName = 'token', clientConfig = null) {
        this._documentClient = new DynamoDBClient(clientConfig);

        this._tableName = tableName;

        this._tokensIndexName = tokensIndexName;
    }

    /**
     *
     * @param {string} token
     * @returns {Promise<Token|null>}
     */
    async findByToken (token) {
        if (!token) {
            return Promise.resolve(null);
        }

        const query = new QueryCommand({
            TableName: this._tableName,
            IndexName: this._tokensIndexName,
            KeyConditionExpression: '#token = :token',
            ExpressionAttributeNames: {
                '#token': 'token'
            },
            ExpressionAttributeValues: {
                ':token': { S: `${token}` }
            },
            Limit: 1
        });

        const data = await this._documentClient.send(query);

        if (data.Items.length === 0) {
            return null;
        }
        const { senderId, pageId } = unmarshall(data.Items[0]);
        return { senderId, token, pageId };
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {{(): Promise<string>}} customTokenFactory
     * @returns {Promise<Token|null>}
     */
    getOrCreateToken (senderId, pageId, customTokenFactory = tokenFactory) {
        return this._getToken(senderId, pageId)
            .then((token) => {
                if (!token) {
                    return this._createAndGetToken(senderId, pageId, customTokenFactory);
                }
                return token;
            });
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<Token|null>}
     */
    async _getToken (senderId, pageId) {
        const get = new GetItemCommand({
            TableName: this._tableName,
            Key: { senderId: { S: senderId }, pageId: { S: pageId } }
        });

        const data = await this._documentClient.send(get);

        if (!data.Item) {
            return null;
        }
        const { senderId: fetchedSenderId, token } = unmarshall(data.Item);
        return { senderId: fetchedSenderId, token, pageId };
    }

    async _createAndGetToken (senderId, pageId, createTokenFn) {
        const token = await Promise.resolve(createTokenFn());

        const tokenObject = { senderId, token, pageId };

        const put = new PutItemCommand({
            TableName: this._tableName,
            Item: marshall(tokenObject),
            ConditionExpression: 'attribute_not_exists(senderId)'
        });

        try {
            await this._documentClient.send(put);
            return tokenObject;
        } catch (e) {
            const existing = await this._getToken(senderId, pageId);
            if (!existing) {
                throw new Error('Cant create token');
            }
            return existing;
        }
    }

}

module.exports = BotTokenStorage;
