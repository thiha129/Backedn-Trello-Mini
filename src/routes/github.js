const express = require('express');
const axios = require('axios');
const db = require('../utils/firebase');
const authenticateToken = require('../middlewares/auth');
const router = express.Router({ mergeParams: true });

// OAuth: Redirect to GitHub
router.get('/login', (req, res) => {
  const redirect_uri = `${process.env.FRONTEND_URL}/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}&scope=repo`;
  res.redirect(url);
});

// OAuth: Callback (frontend sẽ gọi backend để lấy access_token)
router.post('/callback', async (req, res) => {
  const { code } = req.body;
  const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  }, { headers: { Accept: 'application/json' } });
  res.json(tokenRes.data); // { access_token, ... }
});

// Lấy info repo (branches, pulls, issues, commits)
router.get('/repositories/:repositoryId/github-info', authenticateToken, async (req, res) => {
  const { repositoryId } = req.params;
  const { accessToken } = req.query;
  const headers = { Authorization: `token ${accessToken}` };
  const [branches, pulls, issues, commits] = await Promise.all([
    axios.get(`https://api.github.com/repos/${repositoryId}/branches`, { headers }),
    axios.get(`https://api.github.com/repos/${repositoryId}/pulls`, { headers }),
    axios.get(`https://api.github.com/repos/${repositoryId}/issues`, { headers }),
    axios.get(`https://api.github.com/repos/${repositoryId}/commits`, { headers }),
  ]);
  res.json({
    repositoryId,
    branches: branches.data.map(b => ({ name: b.name, lastCommitSha: b.commit.sha })),
    pulls: pulls.data.map(p => ({ title: p.title, pullNumber: p.number })),
    issues: issues.data.map(i => ({ title: i.title, issueNumber: i.number })),
    commits: commits.data.map(c => ({ sha: c.sha, message: c.commit.message })),
  });
});

// Attach GitHub pull/commit/issue vào task
router.post('/boards/:boardId/cards/:cardId/tasks/:taskId/github-attach', authenticateToken, async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const { type, number, sha } = req.body;
  const attachRef = db.collection('boards').doc(boardId).collection('cards').doc(cardId).collection('tasks').doc(taskId).collection('github_attachments').doc();
  const data = { type, number, sha };
  await attachRef.set(data);
  res.status(201).json({ taskId, attachmentId: attachRef.id, ...data });
});

// Lấy danh sách attachment của task
router.get('/boards/:boardId/cards/:cardId/tasks/:taskId/github-attachments', authenticateToken, async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const snapshot = await db.collection('boards').doc(boardId).collection('cards').doc(cardId).collection('tasks').doc(taskId).collection('github_attachments').get();
  const result = [];
  snapshot.forEach(doc => result.push({ attachmentId: doc.id, ...doc.data() }));
  res.status(200).json(result);
});

// Xóa attachment khỏi task
router.delete('/boards/:boardId/cards/:cardId/tasks/:taskId/github-attachments/:attachmentId', authenticateToken, async (req, res) => {
  const { boardId, cardId, taskId, attachmentId } = req.params;
  await db.collection('boards').doc(boardId).collection('cards').doc(cardId).collection('tasks').doc(taskId).collection('github_attachments').doc(attachmentId).delete();
  res.status(204).send();
});

module.exports = router;
