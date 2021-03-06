"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = require("aws-sdk");
var moment = require("moment");
var uuid = require("uuid/v1");
var _ = require("lodash");
var Service = /** @class */ (function () {
    function Service(tableName, keyId) {
        this.client = new aws_sdk_1.DynamoDB.DocumentClient();
        this.debug = false;
        this.tableName = tableName;
        this.keyId = keyId;
    }
    Service.prototype.debugOn = function () {
        this.debug = true;
    };
    Service.prototype.removeEmptyObjects = function (obj) {
        return _(obj)
            .pickBy(_.isObject) // pick objects only
            .mapValues(this.removeEmptyObjects) // call only for object values
            .omitBy(_.isEmpty) // remove all empty objects
            .assign(_.omitBy(obj, _.isObject)) // assign back primitive values
            .pickBy(_.identity)
            .value();
    };
    Service.prototype.setUserId = function (id) {
        this.userId = id;
    };
    Service.prototype.getByUser = function (id, userId) {
        var params = {
            TableName: this.tableName,
            KeyConditionExpression: '#id = :id',
            ExpressionAttributeNames: {
                '#userId': 'userId',
                '#id': this.keyId
            },
            ExpressionAttributeValues: {
                ':userId': userId,
                ':id': id
            },
            FilterExpression: '#userId = :userId'
        };
        if (this.debug) {
            console.log(params);
        }
        return this.client.query(params).promise();
    };
    Service.prototype.getByIndex = function (id, indexName) {
        var params = {
            TableName: this.tableName,
            IndexName: indexName,
            KeyConditionExpression: '#id = :id',
            ExpressionAttributeNames: {
                '#id': this.keyId
            },
            ExpressionAttributeValues: {
                ':id': id
            }
        };
        if (this.debug) {
            console.log(params);
        }
        return this.client.query(params).promise();
    };
    Service.prototype.get = function (id) {
        if (this.userId) {
            return this.getByUser(id, this.userId);
        }
        var params = {
            TableName: this.tableName,
            Key: (_a = {},
                _a[this.keyId] = id,
                _a)
        };
        if (this.debug) {
            console.log(params);
        }
        return this.client.get(params).promise();
        var _a;
    };
    Service.prototype.create = function (resource) {
        var _this = this;
        resource = this.removeEmptyObjects(resource);
        resource.createdAt = moment().toISOString();
        resource.updatedAt = moment().toISOString();
        resource[this.keyId] = uuid();
        if (this.userId) {
            resource.userId = this.userId;
        }
        var params = {
            TableName: this.tableName,
            Item: resource
        };
        if (this.debug) {
            console.log(params);
        }
        return new Promise(function (resolve, reject) {
            _this.client.put(params, function (err, result) {
                if (err)
                    return reject(err);
                resolve(params);
            });
        });
    };
    Service.prototype.list = function () {
        var params = {
            TableName: this.tableName
        };
        if (this.userId) {
            params.ExpressionAttributeNames = {};
            params.ExpressionAttributeValues = {};
            params.ExpressionAttributeNames['#userId'] = 'userId';
            params.ExpressionAttributeValues[':userId'] = this.userId;
            params.FilterExpression = '#userId = :userId';
        }
        if (this.debug) {
            console.log(params);
        }
        return this.client.scan(params).promise();
    };
    Service.prototype.delete = function (id) {
        var params = {
            TableName: this.tableName,
            Key: (_a = {},
                _a[this.keyId] = id,
                _a)
        };
        if (this.userId) {
            params.ExpressionAttributeNames = {};
            params.ExpressionAttributeValues = {};
            params.ExpressionAttributeNames['#userId'] = 'userId';
            params.ExpressionAttributeValues[':userId'] = this.userId;
            params.ConditionExpression = '#userId = :userId';
        }
        if (this.debug) {
            console.log(params);
        }
        return this.client.delete(params).promise();
        var _a;
    };
    Service.prototype.update = function (id, resource) {
        resource = this.removeEmptyObjects(resource);
        var payload = _.reduce(resource, function (memo, value, key) {
            memo.ExpressionAttributeNames["#" + key] = key;
            memo.ExpressionAttributeValues[":" + key] = value;
            memo.UpdateExpression.push("#" + key + " = :" + key);
            return memo;
        }, {
            TableName: this.tableName,
            Key: (_a = {},
                _a[this.keyId] = id,
                _a),
            ReturnValues: 'ALL_NEW',
            UpdateExpression: [],
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {},
            ConditionExpression: {}
        });
        if (this.userId) {
            payload.ExpressionAttributeNames['#userId'] = 'userId';
            payload.ExpressionAttributeValues[':userId'] = this.userId;
            payload.ConditionExpression = '#userId = :userId';
        }
        payload.UpdateExpression = 'SET ' + payload.UpdateExpression.join(', ');
        if (this.debug) {
            console.log(payload);
        }
        return this.client.update(payload).promise();
        var _a;
    };
    return Service;
}());
exports.Service = Service;
