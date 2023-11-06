/*
 * @author David Menger
 */
'use strict';

const StateStorage = require('./StateStorage');
const BotTokenStorage = require('./BotTokenStorage');
const ChatLogStorage = require('./ChatLogStorage');
const BotConfigStorage = require('./BotConfigStorage');
const AttachmentCache = require('./AttachmentCache');
const BaseStorage = require('./BaseStorage');

module.exports = {
    StateStorage,
    BotTokenStorage,
    ChatLogStorage,
    BotConfigStorage,
    AttachmentCache,
    BaseStorage
};
