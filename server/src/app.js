const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const candidateRoutes = require('./routes/candidates');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/candidates', candidateRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
});

module.exports = app;
