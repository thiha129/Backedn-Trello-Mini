const express = require('express');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const router = express.Router({ mergeParams: true });
const { emitEvent } = require('../utils/socket');

// Lấy tất cả tasks của card
router.get('/', authenticateToken, async (req, res) => {
  const { boardId, id } = req.params;
  const tasks = [];
  const snapshot = await db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    tasks.push({ id: doc.id, ...data });
  });
  res.status(200).json(tasks);
});

// Tạo task mới
router.post('/', authenticateToken, async (req, res) => {
  const { boardId, id } = req.params;
  const { title, description, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const newTask = await db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').add({
    title,
    description,
    status,
    cardId: id,
    ownerId: req.user.id,
    createdAt: Date.now(),
  });
  emitEvent('taskCreated', { id: newTask.id, cardId: id, boardId, title, description, status }, boardId);
  res.status(201).json({ id: newTask.id, cardId: id, ownerId: req.user.id, title, description, status });
});

// Lấy chi tiết task
router.get('/:taskId', authenticateToken, async (req, res) => {
  const { boardId, id, taskId } = req.params;
  const doc = await db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').doc(taskId).get();
  if (!doc.exists) return res.status(404).json({ error: 'Task not found' });
  res.status(200).json({ id: doc.id, ...doc.data() });
});

// Cập nhật task
router.put('/:taskId', authenticateToken, async (req, res) => {
  const { boardId, id, taskId } = req.params;
  const { title, description, status } = req.body;
  const docRef = db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').doc(taskId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Task not found' });
  await docRef.update({ title, description, status });
  emitEvent('taskUpdated', { id: taskId, cardId: id, boardId, title, description, status }, boardId);
  res.status(200).json({ id: taskId, cardId: id, title, description, status });
});

// Xóa task
router.delete('/:taskId', authenticateToken, async (req, res) => {
  const { boardId, id, taskId } = req.params;
  const docRef = db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').doc(taskId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Task not found' });
  await docRef.delete();
  emitEvent('taskDeleted', { id: taskId, cardId: id, boardId }, boardId);
  res.status(204).send();
});

module.exports = router; 