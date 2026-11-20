const express = require('express');
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  upvoteIssue,
  removeUpvote,
  addComment,
  assignIssue,
  changeStatus,
  addProgressUpdate,
  verifyResolution,
  reopenIssue,
  getMyIssues,
} = require('../controllers/issueController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/mine', protect, getMyIssues);

router.post('/', protect, authorize('citizen'), upload.array('images', 5), createIssue);
router.get('/', optionalAuth, getIssues);
router.get('/:id', optionalAuth, getIssueById);
router.put('/:id', protect, updateIssue);
router.delete('/:id', protect, deleteIssue);

router.post('/:id/upvote', protect, upvoteIssue);
router.delete('/:id/upvote', protect, removeUpvote);
router.post('/:id/comments', protect, addComment);

router.post('/:id/assign', protect, authorize('admin'), assignIssue);
router.post('/:id/status', protect, authorize('admin', 'staff'), changeStatus);
router.post('/:id/progress', protect, authorize('staff'), upload.single('image'), addProgressUpdate);

router.post('/:id/verify', protect, authorize('citizen'), verifyResolution);
router.post('/:id/reopen', protect, reopenIssue);

module.exports = router;
