const crypto = require('crypto');
const secret = () => process.env.JWT_SECRET || 'replace-this-with-a-long-random-secret';
const encode = value => Buffer.from(value).toString('base64url');
const sign = body => crypto.createHmac('sha256', secret()).update(body).digest('base64url');
exports.createToken = user => { const body = encode(JSON.stringify({ sub: user._id.toString(), email: user.email, exp: Date.now() + 604800000 })); return `${body}.${sign(body)}`; };
exports.requireAuth = (req, res, next) => { const token = req.headers.authorization?.replace('Bearer ', ''); if (!token) return res.status(401).json({ message: 'Please sign in to continue.' }); const [body, signature] = token.split('.'); if (!body || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(body)))) return res.status(401).json({ message: 'Your session is invalid.' }); try { const user = JSON.parse(Buffer.from(body, 'base64url').toString()); if (user.exp < Date.now()) return res.status(401).json({ message: 'Your session has expired.' }); req.user = user; next(); } catch { res.status(401).json({ message: 'Your session is invalid.' }); } };
