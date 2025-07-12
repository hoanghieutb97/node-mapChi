const jsonServer = require('json-server');
const path = require('path');
const net = require('net');
const { JSON_SERVER } = require('../config/constants');

// Hàm kiểm tra port có đang được sử dụng không
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => {
            resolve(true); // Port đang được sử dụng
        });
        server.once('listening', () => {
            server.close();
            resolve(false); // Port chưa được sử dụng
        });
        server.listen(port);
    });
}

async function startJSONServer() {
    // Kiểm tra port 3333
    const portInUse = await isPortInUse(JSON_SERVER.PORT);
    if (portInUse) {
     
        return;
    }

    // Nếu port chưa được sử dụng, khởi động JSON Server
    const server = jsonServer.create();
    const router = jsonServer.router(path.join(__dirname, '../../dbjson/db.json'));
    const middlewares = jsonServer.defaults({
        logger: false // Tắt hoàn toàn logger
    });

    server.use(middlewares);
    server.use(router);
    server.listen(JSON_SERVER.PORT, () => {
   
    });
}


module.exports = { startJSONServer};
