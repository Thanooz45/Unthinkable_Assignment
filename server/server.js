require('dotenv').config();
const app = require('./src/app');
const connectDatabase = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDatabase().then(() => app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))).catch(error => { console.error('Database connection failed:', error.message); process.exit(1); });
