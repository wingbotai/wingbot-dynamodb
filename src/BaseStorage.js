/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig} DynamoDBClientConfig */
/** @typedef {import('@aws-sdk/client-dynamodb').DynamoDBClient} DynamoDBClient */
/** @typedef {import('@aws-sdk/lib-dynamodb')} Lib */
/** @typedef {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} DynamoDBDocumentClient */
/** @typedef {import('@aws-sdk/client-dynamodb')} Dynamo */
/** @typedef {import('@aws-sdk/util-dynamodb')} Util */

/**
 * @typedef {object} Logger
 * @prop {Function} log
 * @prop {Function} error
 */

/**
 * @class BaseStorage
 */
class BaseStorage {

    /**
     * @param {string} [tableName]
     * @param {DynamoDBClientConfig} [clientConfig] - preconfigured dynamodb service
     * @param {Logger} [log] - console like logger
     */
    constructor (tableName, clientConfig = {}, log = console) {
        this._tableName = tableName;
        this._clientConfig = clientConfig;
        this._log = log;

        this.__documentClient = null;
        this.__client = null;
        this.__lib = null;
        this.__dynamo = null;
        this.__util = null;
    }

    /**
     * @returns {Lib}
     */
    get _lib () {
        if (this.__lib === null) {
            // @ts-ignore
            this.__lib = module.require('@aws-sdk/lib-dynamodb');
        }
        return this.__lib;
    }

    /**
     * @returns {Dynamo}
     */
    get _dynamo () {
        if (this.__dynamo === null) {
            // @ts-ignore
            this.__dynamo = module.require('@aws-sdk/client-dynamodb');
        }
        return this.__dynamo;
    }

    /**
     * @returns {Util}
     */
    get _util () {
        if (this.__util === null) {
            // @ts-ignore
            this.__util = module.require('@aws-sdk/util-dynamodb');
        }
        return this.__util;
    }

    /**
     * @returns {DynamoDBClient}
     */
    get _client () {
        if (this.__client === null) {
            this.__client = new this._dynamo.DynamoDBClient(this._clientConfig);
        }
        return this.__client;
    }

    /**
     * @returns {DynamoDBDocumentClient}
     */
    get _documentClient () {
        if (this.__documentClient === null) {
            this.__documentClient = this._lib.DynamoDBDocumentClient.from(this._client, {
                marshallOptions: {
                    removeUndefinedValues: true
                }
            });
        }
        return this.__documentClient;
    }

}

module.exports = BaseStorage;
