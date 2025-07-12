const { KeyAndApi } = require('../../config/constants');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const errorHandler = require('./error-handler');

function addNewCardXlsx(linkFIle) {
 
    var fileName = path.basename(linkFIle);

    axios.post(`https://api.trello.com/1/cards?key=${KeyAndApi.apiKey}&token=${KeyAndApi.token}`, {
        name: fileName,

        idList: KeyAndApi.startList,
    })
        .then((response) => {
            uploadFileToTrello(response.data.id, linkFIle);
        

        })
        .catch((error) => {
            errorHandler("addNewCardXlsx", "none", fileName, linkFIle)
            console.log(error);
        });



}
async function uploadFileToTrello(cardId, activeFile) {
    const formData = new FormData();
    formData.append('key', KeyAndApi.apiKey);
    formData.append('token', KeyAndApi.token);
    formData.append('file', fs.createReadStream(activeFile));

    try {
        const response = await axios.post(`https://api.trello.com/1/cards/${cardId}/attachments`, formData, {
            headers: formData.getHeaders(),
        });
       
    } catch (error) {
        errorHandler("uploadFileToTrello", cardId, activeFile)

    }
}


module.exports = {addNewCardXlsx,uploadFileToTrello};