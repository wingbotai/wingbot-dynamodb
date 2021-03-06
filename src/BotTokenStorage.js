/*
 * @author Václav Oborník
 */
'use strict';

const AWS = require('aws-sdk');
const tokenFactory = require('./tokenFactory');

/**
 * @typedef {Object} Token
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
     * @param {AWS.DynamoDB} [dynamoDbService] - preconfigured dynamodb service
     */
    constructor (tableName = 'wingbot-tokens', tokensIndexName = 'token', dynamoDbService = null) {
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

        this._tokensIndexName = tokensIndexName;
    }

    /**
     *
     * @param {string} token
     * @returns {Promise<Token|null>}
     */
    findByToken (token) {
        if (!token) {
            return Promise.resolve(null);
        }
        return this._documentClient.query({
            TableName: this._tableName,
            IndexName: this._tokensIndexName,
            KeyConditionExpression: '#token = :token',
            ExpressionAttributeNames: {
                '#token': 'token'
            },
            ExpressionAttributeValues: {
                ':token': token
            },
            Limit: 1
        })
            .promise()
            .then((data) => {
                if (data.Items.length === 0) {
                    return null;
                }
                const { senderId, pageId } = data.Items[0];
                return { senderId, token, pageId };
            });
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
     * @returns {Promise<{senderId:string,token:string}|null>}
     */
    _getToken (senderId, pageId) {
        return this._documentClient.get({
            TableName: this._tableName,
            Key: { senderId, pageId }
        })
            .promise()
            .then((data) => {
                if (!data.Item) {
                    return null;
                }
                const { senderId: fetchedSenderId, token } = data.Item;
                return { senderId: fetchedSenderId, token, pageId };
            });
    }

    _createAndGetToken (senderId, pageId, createTokenFn) {
        let tokenObject;
        return Promise.resolve(createTokenFn())
            .then((token) => {
                tokenObject = { senderId, token, pageId };

                return this._documentClient.put({
                    TableName: this._tableName,
                    Item: tokenObject,
                    ConditionExpression: 'attribute_not_exists(senderId)'
                }).promise();
            })
            .then(
                () => tokenObject,
                () => this._getToken(senderId, pageId) // probably collision, try read it
                    .then((token) => {
                        if (!token) {
                            throw new Error('Cant create token');
                        }
                        return token;
                    })
            );
    }

}

module.exports = BotTokenStorage;
