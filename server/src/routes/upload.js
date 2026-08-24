const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractText } = require('../services/parsePdf');
const { extractStructuredData, scoreMatch } = require('../services/llm');
const { createCandidate, getAllCandidates, updateScreening } = require('../services/candidateService');
const { requireAuth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Upload a PDF, DOCX, or TXT resume.'));
        }
    }
});

const createParsedCandidate = async (file, owner) => {
    const text = await extractText(file.path, file.mimetype);
    const extractedData = await extractStructuredData(text);
    return createCandidate({ owner, name: extractedData.name, email: extractedData.email, phone: extractedData.phone, skills: extractedData.skills, experience_years: extractedData.experience_years, education: extractedData.education, summary: extractedData.summary, raw_text: text, original_filename: file.originalname, score: 0, justification: '' });
};

router.post('/parse', requireAuth, upload.array('resumes', 20), async (req, res, next) => {
    try {
        if (!req.files?.length) return res.status(400).json({ message: 'Upload at least one PDF, DOCX, or TXT resume.' });
        const results = [];
        for (const file of req.files) {
            try { results.push({ status: 'success', candidate: await createParsedCandidate(file, req.user.sub) }); }
            catch (error) { results.push({ status: 'failed', original_filename: file.originalname, error: error.message }); }
            finally { fs.unlink(file.path, () => {}); }
        }
        res.json({ results });
    } catch (error) { next(error); }
});

router.post('/screen', requireAuth, async (req, res, next) => {
    try {
        const { jobDescription = '', candidateIds = [] } = req.body;
        if (!jobDescription.trim()) return res.status(400).json({ message: 'Enter a job description before screening.' });
        const candidates = await getAllCandidates(req.user.sub);
        const selected = candidates.filter(candidate => !candidateIds.length || candidateIds.includes(candidate.id));
        if (!selected.length) return res.status(400).json({ message: 'Select at least one candidate.' });
        const results = [];
        for (const candidate of selected) {
            const scoring = await scoreMatch(jobDescription, candidate);
            results.push(await updateScreening(candidate.id, req.user.sub, { score: Math.max(0, Math.min(10, Number(scoring.score) || 0)), justification: scoring.justification || 'No explanation returned.', job_description: jobDescription }));
        }
        res.json({ results });
    } catch (error) { next(error); }
});

router.post('/', requireAuth, upload.array('resumes'), async (req, res, next) => {
    try {
        const jobDescription = req.body.jobDescription;
        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ message: "Job description is required." });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one resume file is required." });
        }

        const results = [];
        
        for (const file of req.files) {
            try {
                const text = await extractText(file.path, file.mimetype);
                const extractedData = await extractStructuredData(text);
                const scoringResult = await scoreMatch(jobDescription, extractedData);
                const candidateRecord = await createCandidate({
                    owner: req.user.sub,
                    name: extractedData.name,
                    email: extractedData.email,
                    phone: extractedData.phone,
                    skills: extractedData.skills,
                    experience_years: extractedData.experience_years,
                    education: extractedData.education,
                    summary: extractedData.summary,
                    raw_text: text,
                    job_description: jobDescription,
                    score: scoringResult.score,
                    justification: scoringResult.justification,
                    original_filename: file.originalname
                });
                
                results.push({ status: 'success', candidate: candidateRecord });
            } catch (err) {
                console.error(`Failed processing file ${file.originalname}:`, err);
                results.push({ 
                    status: 'failed', 
                    original_filename: file.originalname, 
                    error: err.message 
                });
            } finally {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Failed to delete temp file", err);
                });
            }
        }

        res.json({ results });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
