const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Helpers ───────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
};

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل' });
    }

    const user = await User.create({ username, email, password });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد وكلمة المرور' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 5000), httpOnly: true });
  res.status(200).json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// ─── GET /api/auth/me ──────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: { id: req.user._id, username: req.user.username, email: req.user.email },
  });
});

module.exports = router;
