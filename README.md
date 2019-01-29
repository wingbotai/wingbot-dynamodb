# DynamoDB plugin for wingbot

# DynamoDB tables definition

All tables uses `${self:custom.prefix}` to be able to use configuration on different bots and environments.

## Conversation States and bot configuration

```yaml
StatesTable:
    Type: AWS::DynamoDB::Table
    Properties:
    TableName: ${self:custom.prefix}-states
    AttributeDefinitions:
      - AttributeName: senderId
        AttributeType: S
      - AttributeName: pageId
        AttributeType: S
    KeySchema:
      - AttributeName: senderId
        KeyType: HASH
      - AttributeName: pageId
        KeyType: RANGE
    ProvisionedThroughput:
      ReadCapacityUnits: 1
      WriteCapacityUnits: 1

BotConfigTable:
    Type: AWS::DynamoDB::Table
    Properties:
    TableName: ${self:custom.prefix}-botconfig
    AttributeDefinitions:
      - AttributeName: k
        AttributeType: S
    KeySchema:
      - AttributeName: k
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
      - AttributeName: pageId
        AttributeType: S
    KeySchema:
      - AttributeName: senderId
        KeyType: HASH
      - AttributeName: pageId
        KeyType: RANGE
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

## Facebook Attachment cache (optional)

```yaml
AttachmentsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: ${self:custom.prefix}-attachments
    AttributeDefinitions:
      - AttributeName: url
        AttributeType: S
    KeySchema:
      - AttributeName: url
        KeyType: HASH
    ProvisionedThroughput:
      ReadCapacityUnits: 1
      WriteCapacityUnits: 1
```

-----------------

# API
## Classes

<dl>
<dt><a href="#StateStorage">StateStorage</a></dt>
<dd><p>Conversation state DynamoDB storage</p>
</dd>
<dt><a href="#BotTokenStorage">BotTokenStorage</a></dt>
<dd><p>Conversation DynamoDB state storage</p>
</dd>
<dt><a href="#ChatLogStorage">ChatLogStorage</a></dt>
<dd><p>DynamoDB Chat Log storage</p>
</dd>
<dt><a href="#BotConfigStorage">BotConfigStorage</a></dt>
<dd><p>Storage for wingbot.ai conversation config</p>
</dd>
<dt><a href="#AttachmentCache">AttachmentCache</a></dt>
<dd><p>Storage for Facebook attachment ids</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#State">State</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Token">Token</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="StateStorage"></a>

## StateStorage
Conversation state DynamoDB storage

**Kind**: global class  

* [StateStorage](#StateStorage)
    * [new StateStorage([tableName], [dynamoDbService])](#new_StateStorage_new)
    * [.getState(senderId, pageId)](#StateStorage+getState) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
    * [.getOrCreateAndLock(senderId, pageId, [defaultState], [timeout])](#StateStorage+getOrCreateAndLock) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.saveState(state)](#StateStorage+saveState) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_StateStorage_new"></a>

### new StateStorage([tableName], [dynamoDbService])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;states&quot;</code> |  |
| [dynamoDbService] | <code>AWS.DynamoDB</code> |  | preconfigured dynamodb service |

<a name="StateStorage+getState"></a>

### stateStorage.getState(senderId, pageId) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

<a name="StateStorage+getOrCreateAndLock"></a>

### stateStorage.getOrCreateAndLock(senderId, pageId, [defaultState], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - - conversation state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| senderId | <code>string</code> |  | sender identifier |
| pageId | <code>string</code> |  | page/channel identifier |
| [defaultState] | <code>Object</code> |  | default state of the conversation |
| [timeout] | <code>number</code> | <code>300</code> | given default state |

<a name="StateStorage+saveState"></a>

### stateStorage.saveState(state) ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>Object</code> | conversation state |

<a name="BotTokenStorage"></a>

## BotTokenStorage
Conversation DynamoDB state storage

**Kind**: global class  

* [BotTokenStorage](#BotTokenStorage)
    * [new BotTokenStorage([tableName], [tokensIndexName], [dynamoDbService])](#new_BotTokenStorage_new)
    * [.findByToken(token)](#BotTokenStorage+findByToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
    * [.getOrCreateToken(senderId, pageId, customTokenFactory)](#BotTokenStorage+getOrCreateToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
    * [._getToken(senderId, pageId)](#BotTokenStorage+_getToken) ⇒ <code>Promise.&lt;({senderId:string, token:string}\|null)&gt;</code>

<a name="new_BotTokenStorage_new"></a>

### new BotTokenStorage([tableName], [tokensIndexName], [dynamoDbService])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;wingbot-tokens&quot;</code> | the table name |
| [tokensIndexName] | <code>string</code> | <code>&quot;token&quot;</code> | index to query table by token |
| [dynamoDbService] | <code>AWS.DynamoDB</code> | <code></code> | preconfigured dynamodb service |

<a name="BotTokenStorage+findByToken"></a>

### botTokenStorage.findByToken(token) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| token | <code>string</code> | 

<a name="BotTokenStorage+getOrCreateToken"></a>

### botTokenStorage.getOrCreateToken(senderId, pageId, customTokenFactory) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| customTokenFactory | <code>Object</code> | 

<a name="BotTokenStorage+_getToken"></a>

### botTokenStorage._getToken(senderId, pageId) ⇒ <code>Promise.&lt;({senderId:string, token:string}\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

<a name="ChatLogStorage"></a>

## ChatLogStorage
DynamoDB Chat Log storage

**Kind**: global class  

* [ChatLogStorage](#ChatLogStorage)
    * [new ChatLogStorage([tableName], [dynamoDbService], [log])](#new_ChatLogStorage_new)
    * [.log(userId, responses, request)](#ChatLogStorage+log) ⇒ <code>Promise</code>

<a name="new_ChatLogStorage_new"></a>

### new ChatLogStorage([tableName], [dynamoDbService], [log])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;chatlog&quot;</code> |  |
| [dynamoDbService] | <code>AWS.DynamoDB</code> | <code></code> | preconfigured dynamodb service |
| [log] | <code>Object</code> |  | console like logger |

<a name="ChatLogStorage+log"></a>

### chatLogStorage.log(userId, responses, request) ⇒ <code>Promise</code>
Log single event

**Kind**: instance method of [<code>ChatLogStorage</code>](#ChatLogStorage)  

| Param | Type | Description |
| --- | --- | --- |
| userId | <code>string</code> |  |
| responses | <code>Array.&lt;Object&gt;</code> | list of sent responses |
| request | <code>Object</code> | event request |

<a name="BotConfigStorage"></a>

## BotConfigStorage
Storage for wingbot.ai conversation config

**Kind**: global class  

* [BotConfigStorage](#BotConfigStorage)
    * [new BotConfigStorage([tableName], [dynamoDbService])](#new_BotConfigStorage_new)
    * [.api([onUpdate], [acl])](#BotConfigStorage+api) ⇒ <code>Object</code>
    * [.invalidateConfig()](#BotConfigStorage+invalidateConfig) ⇒ <code>Promise</code>
    * [.getConfigTimestamp()](#BotConfigStorage+getConfigTimestamp) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.updateConfig(newConfig)](#BotConfigStorage+updateConfig) ⇒ <code>Promise.&lt;T&gt;</code>
    * [.getConfig()](#BotConfigStorage+getConfig) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>

<a name="new_BotConfigStorage_new"></a>

### new BotConfigStorage([tableName], [dynamoDbService])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;wingbot-config&quot;</code> | the table name |
| [dynamoDbService] | <code>AWS.DynamoDB</code> | <code></code> | preconfigured dynamodb service |

<a name="BotConfigStorage+api"></a>

### botConfigStorage.api([onUpdate], [acl]) ⇒ <code>Object</code>
Returns botUpdate API for wingbot

**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  

| Param | Type | Description |
| --- | --- | --- |
| [onUpdate] | <code>function</code> | async update handler function |
| [acl] | <code>function</code> \| <code>Array.&lt;string&gt;</code> | acl configuration |

<a name="BotConfigStorage+invalidateConfig"></a>

### botConfigStorage.invalidateConfig() ⇒ <code>Promise</code>
Invalidates current configuration

**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+getConfigTimestamp"></a>

### botConfigStorage.getConfigTimestamp() ⇒ <code>Promise.&lt;number&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+updateConfig"></a>

### botConfigStorage.updateConfig(newConfig) ⇒ <code>Promise.&lt;T&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
**Template**: T  

| Param | Type |
| --- | --- |
| newConfig | <code>T</code> | 

<a name="BotConfigStorage+getConfig"></a>

### botConfigStorage.getConfig() ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="AttachmentCache"></a>

## AttachmentCache
Storage for Facebook attachment ids

**Kind**: global class  

* [AttachmentCache](#AttachmentCache)
    * [new AttachmentCache([tableName], [dynamoDbService])](#new_AttachmentCache_new)
    * [.findAttachmentByUrl(url)](#AttachmentCache+findAttachmentByUrl) ⇒ <code>Promise.&lt;(number\|null)&gt;</code>
    * [.saveAttachmentId(url, attachmentId)](#AttachmentCache+saveAttachmentId) ⇒ <code>Promise</code>

<a name="new_AttachmentCache_new"></a>

### new AttachmentCache([tableName], [dynamoDbService])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableName] | <code>string</code> | <code>&quot;wingbot-attachment-cache&quot;</code> | the table name |
| [dynamoDbService] | <code>AWS.DynamoDB</code> | <code></code> | preconfigured dynamodb service |

<a name="AttachmentCache+findAttachmentByUrl"></a>

### attachmentCache.findAttachmentByUrl(url) ⇒ <code>Promise.&lt;(number\|null)&gt;</code>
**Kind**: instance method of [<code>AttachmentCache</code>](#AttachmentCache)  

| Param | Type |
| --- | --- |
| url | <code>string</code> | 

<a name="AttachmentCache+saveAttachmentId"></a>

### attachmentCache.saveAttachmentId(url, attachmentId) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>AttachmentCache</code>](#AttachmentCache)  

| Param | Type |
| --- | --- |
| url | <code>string</code> | 
| attachmentId | <code>number</code> | 

<a name="State"></a>

## State : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| state | <code>Object</code> | 

<a name="Token"></a>

## Token : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| token | <code>string</code> | 

