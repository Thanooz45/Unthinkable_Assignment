const mongoose = require('mongoose');

async function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI is not set. Add it to server/.env before using the API.');
        return;
    }
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'talentlens' });
    console.log('Connected to MongoDB');
}

module.exports = connectDatabase;
