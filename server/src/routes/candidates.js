const express = require('express');
const router = express.Router();
const candidateService = require('../services/candidateService');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);

router.get('/', async (req, res, next) => {
    try {
        const candidates = await candidateService.getAllCandidates(req.user.sub);
        res.json(candidates);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const candidate = await candidateService.getCandidateById(req.params.id, req.user.sub);
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });
        res.json(candidate);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const success = await candidateService.deleteCandidate(req.params.id, req.user.sub);
        if (!success) return res.status(404).json({ message: "Candidate not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
