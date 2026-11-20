const Issue = require('../models/Issue');
const StatusHistory = require('../models/StatusHistory');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

// @route GET /api/staff/tasks
const getMyTasks = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { assignedTo: req.user._id };
  if (status) query.status = status;

  const tasks = await Issue.find(query)
    .populate('reportedBy', 'name')
    .populate('department', 'name')
    .sort('-priorityScore -createdAt')
    .lean();

  const summary = {
    assigned: tasks.filter((t) => t.status === 'ASSIGNED').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'RESOLVED').length,
    overdue: tasks.filter(
      (t) => !['RESOLVED', 'REJECTED'].includes(t.status) && Date.now() - new Date(t.createdAt).getTime() > 5 * 24 * 60 * 60 * 1000
    ).length,
  };

  res.json({ success: true, tasks, summary });
});

// @route GET /api/staff/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Issue.findOne({ _id: req.params.id, assignedTo: req.user._id })
    .populate('reportedBy', 'name phone')
    .populate('department', 'name')
    .lean();

  if (!task) return res.status(404).json({ success: false, message: 'Task not found or not assigned to you.' });

  const history = await StatusHistory.find({ issue: task._id }).sort('createdAt').lean();
  res.json({ success: true, task, history });
});

// @route PUT /api/staff/tasks/:id  (accept task / update basic fields)
const acceptTask = asyncHandler(async (req, res) => {
  const task = await Issue.findOne({ _id: req.params.id, assignedTo: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found or not assigned to you.' });

  if (task.status === 'ASSIGNED') {
    task.status = 'IN_PROGRESS';
    await task.save();
    await StatusHistory.create({
      issue: task._id,
      fromStatus: 'ASSIGNED',
      toStatus: 'IN_PROGRESS',
      changedBy: req.user._id,
      note: 'Staff accepted the task and started work',
    });
    await notify(task.reportedBy, `Work has started on your complaint ${task.issueId}.`, 'WORK_STARTED', task._id);
  }

  res.json({ success: true, task });
});

// @route POST /api/staff/tasks/:id/progress  -> delegated to issueController.addProgressUpdate via routes

module.exports = { getMyTasks, getTaskById, acceptTask };
