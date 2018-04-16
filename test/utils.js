/*
 * @author David Menger
 */
'use strict';

const { DynamoDB } = require('aws-sdk');

const db = new DynamoDB({
    endpoint: 'http://localhost:8000',
    region: 'eu-west-1'
});

function createTable (tableData) {
    return new Promise((resolve, reject) => {
        db.createTable(tableData, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function dropTable (tableName) {
    return new Promise((resolve, reject) => {
        db.deleteTable({
            TableName: tableName
        }, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function describeTable (tableName) {
    return new Promise((resolve) => {
        db.describeTable({
            TableName: tableName
        }, (err, res) => {
            if (err) {
                resolve(null);
            } else {
                resolve(res.Table || null);
            }
        });
    });
}


async function createTableIfNotExists (tableData) {
    const table = await describeTable(tableData.TableName);

    if (table) {
        await dropTable(tableData.TableName);
    }

    await createTable(tableData);
}

module.exports = {
    createTableIfNotExists,
    dropTable,
    db
};
