const express = require('express');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const router = express.Router({ mergeParams: true });
const { emitEvent } = require('../utils/socket');

// Lấy tất cả cards của board
router.get('/', authenticateToken, async (req, res) => {
  const { boardId } = req.params;
  const cards = [];
  const snapshot = await db.collection('boards').doc(boardId).collection('cards').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    cards.push({ id: doc.id, name: data.name, description: data.description });
  });
  res.status(200).json(cards);
});

// Tạo card mới
router.post('/', authenticateToken, async (req, res) => {
  const { boardId } = req.params;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const newCard = await db.collection('boards').doc(boardId).collection('cards').add({
    name,
    description,
    createdAt: Date.now(),
    owner: req.user.id,
    members: [req.user.id],
  });
  emitEvent('cardCreated', { id: newCard.id, name, description, boardId }, boardId);
  res.status(201).json({ id: newCard.id, name, description });
});

// Lấy chi tiết card
router.get('/:id', authenticateToken, async (req, res) => {
  const { boardId, id } = req.params;
  const doc = await db.collection('boards').doc(boardId).collection('cards').doc(id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Card not found' });
  const data = doc.data();
  res.status(200).json({ id: doc.id, name: data.name, description: data.description });
});

// Lấy cards theo user
router.get('/user/:user_id', authenticateToken, async (req, res) => {
  const { boardId, user_id } = req.params;
  const cards = [];
  const snapshot = await db.collection('boards').doc(boardId).collection('cards').where('members', 'array-contains', user_id).get();
  snapshot.forEach(doc => {
    const data = doc.data();
    cards.push({
      id: doc.id,
      name: data.name,
      description: data.description,
      tasks_count: data.tasks_count || 0,
      list_member: data.members || [],
      createdAt: data.createdAt || null,
    });
  });
  res.status(200).json(cards);
});

// Cập nhật card
router.put('/:id', authenticateToken, async (req, res) => {
  const { boardId, id } = req.params;
  const { name, description, params } = req.body;
  const docRef = db.collection('boards').doc(boardId).collection('cards').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Card not found' });
  await docRef.update({ name, description, ...params });
  emitEvent('cardUpdated', { id, name, description, boardId }, boardId);
  res.status(200).json({ id, name, description });
});

// Xóa card
router.delete('/:id', authenticateToken, async (req, res) => {
  const { boardId, id } = req.params;
  const docRef = db.collection('boards').doc(boardId).collection('cards').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Card not found' });
  await docRef.delete();
  emitEvent('cardDeleted', { id, boardId }, boardId);
  res.status(204).send();
});

module.exports = router; 