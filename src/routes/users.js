const express = require('express');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const router = express.Router();

// Lấy thông tin user
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const doc = await db.collection('users').doc(id).get();
  if (!doc.exists) return res.status(404).json({ error: 'User not found' });
  res.status(200).json({ id: doc.id, ...doc.data() });
});

// Cập nhật thông tin user
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
  const { email, ...rest } = req.body;
  await db.collection('users').doc(id).update(rest);
  const doc = await db.collection('users').doc(id).get();
  res.status(200).json({ id: doc.id, ...doc.data() });
});

module.exports = router; 