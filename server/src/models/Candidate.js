const mongoose = require('mongoose');

module.exports = mongoose.model('Candidate', new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Unknown' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience_years: { type: Number, default: 0 },
    education: { type: String, default: '' },
    summary: { type: String, default: '' },
    raw_text: { type: String, default: '' },
    job_description: { type: String, default: '' },
    score: { type: Number, default: 0 },
    justification: { type: String, default: '' },
    original_filename: { type: String, default: '' }
}, { timestamps: true }));
