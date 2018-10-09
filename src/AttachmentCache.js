/*
 * @author David Menger
 */
'use strict';

const AWS = require('aws-sdk');

/**
 * Storage for Facebook attachment ids
 */
class AttachmentCache {

    /**
     * @param {string} [tableName] - the table name
     * @param {AWS.DynamoDB} [dynamoDbService] - preconfigured dynamodb service
     */
    constructor (tableName = 'wingbot-attachment-cache', dynamoDbService = null) {
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
     * @param {string} url
     * @returns {Promise<number|null>}
     */
    findAttachmentByUrl (url) {
        return this._documentClient.get({
            TableName: this._tableName,
            Key: { url }
        })
            .promise()
            .then((data) => {
                if (!data.Item) {
                    return null;
                }

                return data.Item.attachmentId;
            });
    }

    /**
     *
     * @param {string} url
     * @param {number} attachmentId
     * @returns {Promise}
     */
    saveAttachmentId (url, attachmentId) {
        return this._documentClient.put({
            TableName: this._tableName,
            Item: { url, attachmentId }
        }).promise();
    }

}

module.exports = AttachmentCache;
