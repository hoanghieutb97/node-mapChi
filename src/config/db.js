const { DATABASE } = require('./constants');
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(DATABASE.MONGODB_URI, {
            dbName: 'theu'
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;  