/*
 * @author David Menger
 */
'use strict';

const {
    DynamoDBClient, GetItemCommand, PutItemCommand
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} DynamoDBClientConfig */

/**
 * Storage for Facebook attachment ids
 */
class AttachmentCache {

    /**
     * @param {string} [tableName] - the table name
     * @param {DynamoDBClientConfig} [clientConfig] - preconfigured dynamodb service
     */
    constructor (tableName = 'wingbot-attachment-cache', clientConfig = null) {
        this._documentClient = new DynamoDBClient(clientConfig);

        this._tableName = tableName;
    }

    /**
     *
     * @param {string} url
     * @returns {Promise<number|null>}
     */
    async findAttachmentByUrl (url) {
        const get = new GetItemCommand({
            TableName: this._tableName,
            Key: { url: { S: url } }
        });

        const data = await this._documentClient.send(get);

        if (!data.Item) {
            return null;
        }

        const item = unmarshall(data.Item);

        return item.attachmentId;
    }

    /**
     *
     * @param {string} url
     * @param {number} attachmentId
     * @returns {Promise}
     */
    async saveAttachmentId (url, attachmentId) {
        const put = new PutItemCommand({
            TableName: this._tableName,
            Item: marshall({ url, attachmentId })
        });

        await this._documentClient.send(put);
    }

}

module.exports = AttachmentCache;
