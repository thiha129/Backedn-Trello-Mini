const express = require('express');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const router = express.Router({ mergeParams: true });

// Mời thành viên vào board
router.post('/', authenticateToken, async (req, res) => {
  const { boardId } = req.params;
  const { invite_id, board_owner_id, member_id, email_member, status } = req.body;
  // Lưu lời mời vào collection invitations
  await db.collection('invitations').add({
    invite_id,
    boardId,
    board_owner_id,
    member_id,
    email_member,
    status: status || 'pending',
    createdAt: Date.now(),
  });
  // TODO: Gửi email hoặc emit socket nếu cần
  res.status(200).json({ success: true });
});

// Thành viên chấp nhận hoặc từ chối lời mời
router.post('/:cardId/invite/accept', authenticateToken, async (req, res) => {
  const { boardId, cardId } = req.params;
  const { invite_id, card_id, member_id, status } = req.body;
  // Cập nhật trạng thái invitation
  const snapshot = await db.collection('invitations').where('invite_id', '==', invite_id).get();
  if (snapshot.empty) return res.status(404).json({ error: 'Invitation not found' });
  const docRef = snapshot.docs[0].ref;
  await docRef.update({ status });
  // Nếu accepted thì thêm member vào card
  if (status === 'accepted') {
    const cardRef = db.collection('boards').doc(boardId).collection('cards').doc(card_id);
    await cardRef.update({
      members: admin.firestore.FieldValue.arrayUnion(member_id),
    });
  }
  res.status(200).json({ success: true });
});

module.exports = router; 