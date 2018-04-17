# DynamoDB plugin for wingbot

# DynamoDB tables definition

All tables uses `${self:custom.prefix}` to be able to use configuration on different bots and environments.

## Conversation States

```yaml
StatesTable:
    Type: AWS::DynamoDB::Table
    Properties:
    TableName: ${self:custom.prefix}-states
    AttributeDefinitions:
        - AttributeName: senderId
        AttributeType: S
    KeySchema:
        - AttributeName: senderId
        KeyType: HASH
    ProvisionedThroughput:
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1
```

## Chat Logs (optional)

```yaml
ChatlogTable:
    Type: AWS::DynamoDB::Table
    Properties:
    TableName: ${self:custom.prefix}-chatlog
    AttributeDefinitions:
        - AttributeName: userId
        AttributeType: S
        - AttributeName: time
        AttributeType: S
    KeySchema:
        - AttributeName: userId
        KeyType: HASH
        - AttributeName: time
        KeyType: RANGE
    ProvisionedThroughput:
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1
```

## Chatbot tokens (optional)

```yaml
BottokensTable:
    Type: AWS::DynamoDB::Table
    Properties:
    TableName: ${self:custom.prefix}-bottokens
    AttributeDefinitions:
        - AttributeName: senderId
        AttributeType: S
        - AttributeName: token
        AttributeType: S
    KeySchema:
        - AttributeName: senderId
        KeyType: HASH
    GlobalSecondaryIndexes:
        - IndexName: token
        KeySchema:
            - AttributeName: token
            KeyType: HASH
        Projection:
            ProjectionType: ALL
        ProvisionedThroughput:
            ReadCapacityUnits: 1
            WriteCapacityUnits: 1
    ProvisionedThroughput:
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1
```

-----------------

# API
## Classes

<dl>
<dt><a href="#DynamoStateStorage">DynamoStateStorage</a></dt>
<dd><p>Conversation state DynamoDB storage</p>
</dd>
<dt><a href="#DynamoBotToken">DynamoBotToken</a></dt>
<dd><p>Conversation DynamoDB state storage</p>
</dd>
<dt><a href="#DynamoChatLog">DynamoChatLog</a></dt>
<dd><p>DynamoDB Chat Log storage</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Token">Token</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="DynamoStateStorage"></a>

## DynamoStateStorage
Conversation state DynamoDB storage

**Kind**: global class

* [DynamoStateStorage](#DynamoStateStorage)
    * [new DynamoStateStorage([tableName], [dynamoDbService])](#new_DynamoStateStorage_new)
    * [.getOrCreateAndLock(senderId, [defaultState], [timeout])](#DynamoStateStorage+getOrCreateAndLock) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.onAfterStateLoad(req, state)](#DynamoStateStorage+onAfterStateLoad) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.saveState(state)](#DynamoStateStorage+saveState) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_DynamoStateStorage_new"></a>

### new DynamoStateStorage([tableName], [dynamoDbService])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;states&quot;</code> |  |
| [dynamoDbService] | <code>AWS.DynamoDB</code> |  | preconfigured dynamodb service |

<a name="DynamoStateStorage+getOrCreateAndLock"></a>

### dynamoStateStorage.getOrCreateAndLock(senderId, [defaultState], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: instance method of [<code>DynamoStateStorage</code>](#DynamoStateStorage)
**Returns**: <code>Promise.&lt;Object&gt;</code> - - conversation state

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| senderId | <code>any</code> |  | sender identifier |
| [defaultState] | <code>Object</code> |  | default state of the conversation |
| [timeout] | <code>number</code> | <code>300</code> | given default state |

<a name="DynamoStateStorage+onAfterStateLoad"></a>

### dynamoStateStorage.onAfterStateLoad(req, state) ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: instance method of [<code>DynamoStateStorage</code>](#DynamoStateStorage)
**Returns**: <code>Promise.&lt;Object&gt;</code> - - conversation state

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Request</code> | chat request |
| state | <code>Object</code> | conversation state |

<a name="DynamoStateStorage+saveState"></a>

### dynamoStateStorage.saveState(state) ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: instance method of [<code>DynamoStateStorage</code>](#DynamoStateStorage)

| Param | Type | Description |
| --- | --- | --- |
| state | <code>Object</code> | conversation state |

<a name="DynamoBotToken"></a>

## DynamoBotToken
Conversation DynamoDB state storage

**Kind**: global class

* [DynamoBotToken](#DynamoBotToken)
    * [new DynamoBotToken([tableName], [tokensIndexName], [dynamoDbService])](#new_DynamoBotToken_new)
    * [.findByToken(token)](#DynamoBotToken+findByToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
    * [.getOrCreateToken(senderId, tokenFactory)](#DynamoBotToken+getOrCreateToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
    * [._getToken(senderId)](#DynamoBotToken+_getToken) ⇒ <code>Promise.&lt;({senderId:string, token:string}\|null)&gt;</code>

<a name="new_DynamoBotToken_new"></a>

### new DynamoBotToken([tableName], [tokensIndexName], [dynamoDbService])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;wingbot-tokens&quot;</code> | the table name |
| [tokensIndexName] | <code>string</code> | <code>&quot;token&quot;</code> | index to query table by token |
| [dynamoDbService] | <code>AWS.DynamoDB</code> | <code></code> | preconfigured dynamodb service |

<a name="DynamoBotToken+findByToken"></a>

### dynamoBotToken.findByToken(token) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>DynamoBotToken</code>](#DynamoBotToken)

| Param | Type |
| --- | --- |
| token | <code>string</code> |

<a name="DynamoBotToken+getOrCreateToken"></a>

### dynamoBotToken.getOrCreateToken(senderId, tokenFactory) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>DynamoBotToken</code>](#DynamoBotToken)

| Param | Type |
| --- | --- |
| senderId | <code>string</code> |
| tokenFactory | <code>Object</code> |

<a name="DynamoBotToken+_getToken"></a>

### dynamoBotToken._getToken(senderId) ⇒ <code>Promise.&lt;({senderId:string, token:string}\|null)&gt;</code>
**Kind**: instance method of [<code>DynamoBotToken</code>](#DynamoBotToken)

| Param | Type |
| --- | --- |
| senderId | <code>string</code> |

<a name="DynamoChatLog"></a>

## DynamoChatLog
DynamoDB Chat Log storage

**Kind**: global class

* [DynamoChatLog](#DynamoChatLog)
    * [new DynamoChatLog([tableName], [dynamoDbService], [log])](#new_DynamoChatLog_new)
    * [.log(userId, responses, request)](#DynamoChatLog+log)

<a name="new_DynamoChatLog_new"></a>

### new DynamoChatLog([tableName], [dynamoDbService], [log])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;chatlog&quot;</code> |  |
| [dynamoDbService] | <code>AWS.DynamoDB</code> | <code></code> | preconfigured dynamodb service |
| [log] | <code>Object</code> |  | console like logger |

<a name="DynamoChatLog+log"></a>

### dynamoChatLog.log(userId, responses, request)
Log single event

**Kind**: instance method of [<code>DynamoChatLog</code>](#DynamoChatLog)

| Param | Type | Description |
| --- | --- | --- |
| userId | <code>string</code> |  |
| responses | <code>Array.&lt;Object&gt;</code> | list of sent responses |
| request | <code>Object</code> | event request |

<a name="Token"></a>

## Token : <code>Object</code>
**Kind**: global typedef
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> |
| token | <code>string</code> |

