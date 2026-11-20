const express = require('express');
const { getMyTasks, getTaskById, acceptTask } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('staff'));

router.get('/tasks', getMyTasks);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', acceptTask);

module.exports = router;
