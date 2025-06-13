const express = require('express');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const { emitEvent } = require('../utils/socket');
const router = express.Router();

// Lấy tất cả boards của user
router.get('/', authenticateToken, async (req, res) => {
  const boards = [];
  const snapshot = await db.collection('boards').where('members', 'array-contains', req.user.id).get();
  snapshot.forEach(doc => {
    const data = doc.data();
    boards.push({ id: doc.id, name: data.name, description: data.description });
  });
  res.status(200).json(boards);
});

// Tạo board mới
router.post('/', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const newBoard = await db.collection('boards').add({
    name,
    description,
    owner: req.user.id,
    members: [req.user.id],
    createdAt: Date.now(),
  });
  emitEvent('boardCreated', { id: newBoard.id, name, description }, req.user.id);
  res.status(201).json({ id: newBoard.id, name, description });
});

// Lấy chi tiết board
router.get('/:id', authenticateToken, async (req, res) => {
  const doc = await db.collection('boards').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Board not found' });
  const data = doc.data();
  if (!data.members.includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  res.status(200).json({ id: doc.id, name: data.name, description: data.description });
});

// Cập nhật board
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  const docRef = db.collection('boards').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Board not found' });
  const data = doc.data();
  if (data.owner !== req.user.id) return res.status(403).json({ error: 'Only owner can update' });
  await docRef.update({ name, description });
  emitEvent('boardUpdated', { id: doc.id, name, description }, req.user.id);
  res.status(200).json({ id: doc.id, name, description });
});

// Xóa board
router.delete('/:id', authenticateToken, async (req, res) => {
  const docRef = db.collection('boards').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Board not found' });
  const data = doc.data();
  if (data.owner !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });
  await docRef.delete();
  emitEvent('boardDeleted', { id: req.params.id }, req.user.id);
  res.status(204).send();
});

module.exports = router; 