const crypto = require('crypto');
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { createToken, requireAuth } = require('../middleware/auth');
const router = express.Router();
const hash = password => crypto.scryptSync(password, process.env.PASSWORD_SALT || 'talentlens-salt', 64).toString('hex');
const safeUser = user => ({ id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' });
const sendSession = (res, user) => res.json({ token: createToken(user), user: safeUser(user) });
async function ensureDemoUser() { const email = process.env.DEMO_EMAIL || 'usethanooz206@gmail.com'; const password = process.env.DEMO_PASSWORD || '9723@Vinni206'; let user = await User.findOne({ email }); if (!user) user = await User.create({ name: 'Vinni', email, passwordHash: hash(password) }); return user; }
router.post('/login', async (req, res, next) => { try { const { email = '', password = '' } = req.body; await ensureDemoUser(); const user = await User.findOne({ email: email.toLowerCase() }); if (!user || !user.passwordHash || !crypto.timingSafeEqual(Buffer.from(user.passwordHash), Buffer.from(hash(password)))) return res.status(401).json({ message: 'Incorrect email or password.' }); sendSession(res, user); } catch (error) { next(error); } });
router.post('/register', async (req, res, next) => { try { const { name = '', email = '', password = '' } = req.body; if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ message: 'Enter your name, a valid email, and a password with at least 8 characters.' }); if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account already exists for that email.' }); const user = await User.create({ name, email, passwordHash: hash(password) }); sendSession(res, user); } catch (error) { next(error); } });
router.post('/google', async (req, res, next) => { try { if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google sign-in is not configured yet.' }); const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID }); const profile = ticket.getPayload(); let user = await User.findOne({ email: profile.email }); if (!user) user = await User.create({ name: profile.name || 'Google user', email: profile.email, googleId: profile.sub, avatar: profile.picture }); sendSession(res, user); } catch (error) { next(error); } });
router.get('/me', requireAuth, async (req, res, next) => { try { const user = await User.findById(req.user.sub); if (!user) return res.status(401).json({ message: 'Account not found.' }); res.json({ user: safeUser(user) }); } catch (error) { next(error); } });
module.exports = router;
