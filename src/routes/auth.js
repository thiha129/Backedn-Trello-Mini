const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/firebase');
const { sendVerificationEmail } = require('../utils/mailer');
const router = express.Router();

// Gửi mã xác thực qua email
router.post('/request-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.collection('verifications').doc(email).set({ code, createdAt: Date.now() });
  await sendVerificationEmail(email, code);
  res.status(200).json({ message: 'Verification code sent to email' });
});

// Xác thực mã, tạo user nếu chưa có, trả về JWT
router.post('/signin', async (req, res) => {
  const { email, verificationCode } = req.body;
  if (!email || !verificationCode) return res.status(400).json({ error: 'Email and code required' });
  const doc = await db.collection('verifications').doc(email).get();
  if (!doc.exists || doc.data().code !== verificationCode) {
    return res.status(401).json({ error: 'Invalid email or verification code' });
  }
  // Xóa mã xác thực sau khi dùng
  await db.collection('verifications').doc(email).delete();
  // Tạo user nếu chưa có
  let userDoc = await db.collection('users').where('email', '==', email).get();
  let userId;
  if (userDoc.empty) {
    const newUser = await db.collection('users').add({ email, createdAt: Date.now() });
    userId = newUser.id;
  } else {
    userId = userDoc.docs[0].id;
  }
  const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ accessToken: token });
});

module.exports = router;
