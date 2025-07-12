const { KeyAndApi } = require('../../config/constants');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const errorHandler = require('./error-handler');
const filePath = path.join(KeyAndApi.serverFolder, 'status.txt');

function moveToRunDone(cardId) {
    axios.put(`https://api.trello.com/1/cards/${cardId}`, {
        idList: KeyAndApi.listRunDone,
        key: KeyAndApi.apiKey,
        token: KeyAndApi.token
    }).then(function (response) {
        // Xử lý thành công
    })
    .catch(function (error) {
        // Xử lý lỗi
        // errorHandler("moveToRunDone", cardId, "none")
    })
}

function moveToRunErr(cardId) {
    axios.put(`https://api.trello.com/1/cards/${cardId}`, {
        idList: KeyAndApi.listRunErr,
        key: KeyAndApi.apiKey,
        token: KeyAndApi.token
    }).then(function (response) {
        // Xử lý thành công
    })
    .catch(function (error) {
        // Xử lý lỗi
        // errorHandler("moveToRunErr", cardId, "none")
    })
}

module.exports = { moveToRunDone, moveToRunErr };