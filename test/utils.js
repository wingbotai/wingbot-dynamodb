/*
 * @author David Menger
 */
'use strict';

const {
    DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand
} = require('@aws-sdk/client-dynamodb');
const localDynamo = require('local-dynamo');

const process = localDynamo.launch({
    stdio: 'inherit',
    port: 4567,
    sharedDb: true,
    heap: '512m'
});

const ready = new Promise((r) => { setTimeout(r, 5000); });

after(() => {
    process.kill();
});

const dbConfig = {
    endpoint: 'http://localhost:4567',
    region: 'eu-west-1',
    credentials: {
        accessKeyId: '1',
        secretAccessKey: '2'
    }
};

const db = new DynamoDBClient(dbConfig);

/** @typedef {import('@aws-sdk/client-dynamodb').CreateTableCommandInput} CreateTableCommandInput */

/**
 *
 * @param {CreateTableCommandInput} tableData
 * @returns {Promise}
 */
async function createTable (tableData) {
    const cmd = new CreateTableCommand(tableData);
    return db.send(cmd);
}

async function dropTable (tableName) {
    const cmd = new DeleteTableCommand({
        TableName: tableName
    });
    return db.send(cmd);
}

async function describeTable (tableName) {
    const cmd = new DescribeTableCommand({
        TableName: tableName
    });
    try {
        const res = await db.send(cmd);
        return res.Table;
    } catch (e) {
        return null;
    }
}

/**
 *
 * @param {CreateTableCommandInput} tableData
 * @returns {Promise}
 */
async function createTableIfNotExists (tableData) {
    await ready;

    const table = await describeTable(tableData.TableName);

    if (table) {
        await dropTable(tableData.TableName);
    }

    await createTable(tableData);
}

module.exports = {
    createTableIfNotExists,
    dropTable,
    db,
    dbConfig
};
