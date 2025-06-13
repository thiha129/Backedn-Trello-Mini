const express = require('express');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const admin = require('firebase-admin');
const router = express.Router({ mergeParams: true });

// Gán member cho task
router.post('/', authenticateToken, async (req, res) => {
  const { boardId, id, taskId } = req.params;
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ error: 'memberId required' });
  const taskRef = db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').doc(taskId);
  await taskRef.collection('assignments').doc(memberId).set({ memberId });
  res.status(201).json({ taskId, memberId });
});

// Lấy danh sách member được gán cho task
router.get('/', authenticateToken, async (req, res) => {
  const { boardId, id, taskId } = req.params;
  const assignments = [];
  const snapshot = await db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').doc(taskId).collection('assignments').get();
  snapshot.forEach(doc => assignments.push(doc.data()));
  res.status(200).json(assignments);
});

// Bỏ gán member khỏi task
router.delete('/:memberId', authenticateToken, async (req, res) => {
  const { boardId, id, taskId, memberId } = req.params;
  const assignRef = db.collection('boards').doc(boardId).collection('cards').doc(id).collection('tasks').doc(taskId).collection('assignments').doc(memberId);
  await assignRef.delete();
  res.status(204).send();
});

module.exports = router;
