const path = require('path');
const os = require('os');

const filePath = path.join(os.homedir(), 'Desktop', "ServerFile", "xlsx");
const KeyAndApi = {
    listRunDone: "65d461446ba45af7d047e0b5",
    listRunErr: "659802d136aaf9f9db745e0c",
    listArchive: "65d48349181acc584b21736d",
    startList: "659392077c1ff60559669e1f",
    activeBoard: "619a55bb16b4572362761d0a",
    port: 1001,

    // Cập nhật với thông tin API Key, Token và URL đính kèm cụ thể
    apiKey: 'eaab65cdb6b3f930891953f93327e65e',
    token: 'ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28',
    filePath: path.join(os.homedir(), 'Desktop', "ServerFile", "xlsx"),
    // gllm: 'https://sheetdb.io/api/v1/xvqhrhg4y9avq',
    gllm: 'https://sheet.best/api/sheets/e8876c80-1778-414d-ae68-af6b9ec1289c',

    Label_fail_sheet: "65d990c495d5d9682154a9dc",
    Label_fail_FIleDesign: "65d99061e3c2ddd5e0dfd1bb",

    serverFile: "\\\\192.168.1.240\\in",
    serverFolder: path.join(os.homedir(), 'Desktop', "ServerFile"),

    ngrokToken: '2yDyF3poD5a55lUrTNmXYb9F45i_3mwchzrrcfcWY5xSZNxCV',
};


// Đường dẫn JSON Server
const JSON_SERVER = {
    PORT: 3333,
    DB_PATH: './dbjson',
    BASE_URL: 'http://localhost:3333',
    CREATE_ENDPOINT: 'http://localhost:3333/create',
    FILE_ENDPOINT: 'http://localhost:3333/file'
};

// Database configuration
const DATABASE = {
    MONGODB_URI: "mongodb+srv://hoanghieutb97:r8piz5uGp6OKcOGa@cluster0.elvs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
};

module.exports = {

    KeyAndApi,
    JSON_SERVER,
    DATABASE
};