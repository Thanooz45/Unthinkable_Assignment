const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    googleId: String,
    avatar: String
}, { timestamps: true }));
