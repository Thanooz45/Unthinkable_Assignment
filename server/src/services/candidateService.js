const Candidate = require('../models/Candidate');

const serialize = record => record && ({ ...record, id: record._id.toString() });
exports.createCandidate = async data => serialize((await Candidate.create(data)).toObject());
exports.getAllCandidates = async owner => (await Candidate.find({ owner }).sort({ score: -1, createdAt: -1 }).lean()).map(serialize);
exports.getCandidateById = async (id, owner) => serialize(await Candidate.findOne({ _id: id, owner }).lean());
exports.deleteCandidate = async (id, owner) => Boolean(await Candidate.findOneAndDelete({ _id: id, owner }));
exports.updateScreening = async (id, owner, screening) => serialize((await Candidate.findOneAndUpdate({ _id: id, owner }, screening, { new: true }).lean()));
