const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Category = require('../models/Category');
const Department = require('../models/Department');
const Comment = require('../models/Comment');
const Upvote = require('../models/Upvote');
const StatusHistory = require('../models/StatusHistory');
const ResolutionFeedback = require('../models/ResolutionFeedback');
const asyncHandler = require('../utils/asyncHandler');
const generateComplaintId = require('../utils/generateComplaintId');
const { classifyIssue } = require('../services/aiService');
const { calculatePriorityScore, scoreToPriorityLevel } = require('../services/priorityService');
const { findNearbyDuplicates } = require('../services/duplicateService');
const { notify } = require('../services/notificationService');

const UPLOAD_URL_PREFIX = '/uploads';

function toPublicImageUrl(filename, type = 'before') {
  return { url: `${UPLOAD_URL_PREFIX}/${filename}`, type };
}

async function logStatusChange(issueId, fromStatus, toStatus, changedBy, note = '') {
  await StatusHistory.create({ issue: issueId, fromStatus, toStatus, changedBy, note });
}

// @route POST /api/issues
// @access Private (citizen)
// If ?checkDuplicateOnly=true, only runs duplicate detection and does NOT create the issue.
const createIssue = asyncHandler(async (req, res) => {
  const { title, description, category, latitude, longitude, address, ward, checkDuplicateOnly } = req.body;

  if (!title || !description || !category || !latitude || !longitude || !address) {
    return res.status(400).json({
      success: false,
      message: 'title, description, category, latitude, longitude and address are required.',
    });
  }

  const categoryName = typeof category === 'string' ? category.trim() : '';
  const categoryExists = await Category.exists({ name: categoryName, isActive: true });
  if (!categoryExists) {
    return res.status(400).json({ success: false, message: 'Invalid issue category. Please choose an active category.' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ success: false, message: 'Invalid location coordinates.' });
  }

  const duplicates = await findNearbyDuplicates({ longitude: lng, latitude: lat, category: categoryName });

  if (checkDuplicateOnly === 'true' || checkDuplicateOnly === true) {
    return res.json({ success: true, duplicates });
  }

  // Mock AI classification (never requires an API key)
  const aiClassification = classifyIssue({ title, description, category: categoryName });
  const severity = aiClassification.severity;

  const priorityScore = calculatePriorityScore({ severity, upvoteCount: 0, category: categoryName, ward });
  const priority = scoreToPriorityLevel(priorityScore);

  const images = (req.files || []).map((f) => toPublicImageUrl(f.filename, 'before'));

  const issueId = await generateComplaintId();

  const issue = await Issue.create({
    issueId,
    title,
    description,
    category: categoryName,
    reportedBy: req.user._id,
    location: { type: 'Point', coordinates: [lng, lat] },
    address,
    ward: ward || '',
    severity,
    priority,
    priorityScore,
    status: 'REPORTED',
    images,
    aiClassification,
  });

  await logStatusChange(issue._id, null, 'REPORTED', req.user._id, 'Issue reported by citizen');

  // Civic points for a valid report
  req.user.civicPoints += 10;
  await req.user.save();

  res.status(201).json({
    success: true,
    message: 'Your issue has been successfully reported.',
    issue,
    duplicatesWarning: duplicates.length > 0 ? duplicates : undefined,
  });
});

// @route GET /api/issues
// Supports: page, limit, category, status, priority, department, search, near(lat,lng,radius), sort
const getIssues = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    status,
    priority,
    department,
    search,
    lat,
    lng,
    radius = 5000,
    sort = '-createdAt',
  } = req.query;

  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { issueId: new RegExp(search, 'i') },
      { title: new RegExp(search, 'i') },
      { address: new RegExp(search, 'i') },
    ];
  }
  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius, 10),
      },
    };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [issues, total] = await Promise.all([
    Issue.find(query)
      .populate('reportedBy', 'name profileImage')
      .populate('department', 'name')
      .populate('assignedTo', 'name')
      .sort(lat && lng ? undefined : sort) // $near already sorts by distance
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Issue.countDocuments(query),
  ]);

  res.json({
    success: true,
    issues,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @route GET /api/issues/:id  (accepts either Mongo _id or issueId like CF-1001)
const getIssueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { issueId: id };

  const issue = await Issue.findOne(query)
    .populate('reportedBy', 'name profileImage civicPoints')
    .populate('department', 'name')
    .populate('assignedTo', 'name')
    .lean();

  if (!issue) {
    return res.status(404).json({ success: false, message: 'Issue not found.' });
  }

  const [comments, history, hasUpvoted] = await Promise.all([
    Comment.find({ issue: issue._id }).populate('author', 'name profileImage').sort('createdAt').lean(),
    StatusHistory.find({ issue: issue._id }).populate('changedBy', 'name role').sort('createdAt').lean(),
    req.user ? Upvote.exists({ issue: issue._id, user: req.user._id }) : false,
  ]);

  res.json({ success: true, issue, comments, history, hasUpvoted: Boolean(hasUpvoted) });
});

// @route PUT /api/issues/:id
// @access Private (owner citizen while REPORTED, or admin)
const updateIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  const isOwner = issue.reportedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !(isOwner && issue.status === 'REPORTED')) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own issue while it is still in REPORTED status.',
    });
  }

  if (req.body.category !== undefined) {
    const categoryName = typeof req.body.category === 'string' ? req.body.category.trim() : '';
    const categoryExists = await Category.exists({ name: categoryName, isActive: true });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Invalid issue category. Please choose an active category.' });
    }
    issue.category = categoryName;
  }

  const editableFields = ['title', 'description', 'address'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) issue[field] = req.body[field];
  });

  await issue.save();
  res.json({ success: true, issue });
});

// @route DELETE /api/issues/:id
// @access Private (owner while REPORTED, or admin)
const deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  const isOwner = issue.reportedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !(isOwner && issue.status === 'REPORTED')) {
    return res.status(403).json({ success: false, message: 'This issue can no longer be deleted.' });
  }

  await issue.deleteOne();
  res.json({ success: true, message: 'Issue deleted.' });
});

// @route POST /api/issues/:id/upvote
// @access Private
const upvoteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  try {
    await Upvote.create({ issue: issue._id, user: req.user._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already upvoted this issue.' });
    }
    throw err;
  }

  issue.upvoteCount += 1;
  issue.priorityScore = calculatePriorityScore({
    severity: issue.severity,
    upvoteCount: issue.upvoteCount,
    category: issue.category,
    ward: issue.ward,
  });
  if (!issue.priorityOverridden) issue.priority = scoreToPriorityLevel(issue.priorityScore);
  await issue.save();

  const reporter = await User.findById(issue.reportedBy);
  if (reporter) {
    reporter.civicPoints += 2;
    await reporter.save();
  }

  res.json({ success: true, upvoteCount: issue.upvoteCount, priority: issue.priority });
});

// @route DELETE /api/issues/:id/upvote  (remove upvote)
const removeUpvote = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  const deleted = await Upvote.findOneAndDelete({ issue: issue._id, user: req.user._id });
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'You have not upvoted this issue.' });
  }

  issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
  await issue.save();
  res.json({ success: true, upvoteCount: issue.upvoteCount });
});

// @route POST /api/issues/:id/comments
// @access Private
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required.' });
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  const comment = await Comment.create({ issue: issue._id, author: req.user._id, text: text.trim() });
  issue.commentCount += 1;
  await issue.save();

  const populated = await comment.populate('author', 'name profileImage');

  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    await notify(issue.reportedBy, `New comment on your complaint ${issue.issueId}.`, 'COMMENT', issue._id);
  }

  res.status(201).json({ success: true, comment: populated });
});

// @route POST /api/issues/:id/assign
// @access Private (admin)
const assignIssue = asyncHandler(async (req, res) => {
  const { departmentId, staffId } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });
  if (!staffId) {
    return res.status(400).json({ success: false, message: 'Select a staff member to assign this issue.' });
  }

  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    issue.department = dept._id;
  }

  const staff = await User.findOne({ _id: staffId, role: 'staff' });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });
  issue.assignedTo = staff._id;
  await notify(staff._id, `You have been assigned complaint ${issue.issueId}.`, 'ISSUE_ASSIGNED', issue._id);

  const fromStatus = issue.status;
  issue.status = 'ASSIGNED';
  await issue.save();
  await logStatusChange(issue._id, fromStatus, 'ASSIGNED', req.user._id, 'Assigned by admin');

  await notify(
    issue.reportedBy,
    `Your complaint ${issue.issueId} has been assigned to a department.`,
    'ISSUE_ASSIGNED',
    issue._id
  );

  res.json({ success: true, issue });
});

// @route POST /api/issues/:id/status
// @access Private (admin, staff)
const changeStatus = asyncHandler(async (req, res) => {
  const { status, note, priority } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  const fromStatus = issue.status;

  if (status) {
    issue.status = status;
    if (status === 'IN_PROGRESS' && !issue.department) {
      return res.status(400).json({ success: false, message: 'Assign a department before starting work.' });
    }
    if (status === 'RESOLVED') {
      issue.resolvedAt = new Date();
    }
  }

  if (priority && req.user.role === 'admin') {
    issue.priority = priority;
    issue.priorityOverridden = true;
  }

  await issue.save();
  await logStatusChange(issue._id, fromStatus, issue.status, req.user._id, note || '');

  const statusMessages = {
    VERIFIED: `Your complaint ${issue.issueId} has been verified.`,
    IN_PROGRESS: `Work has started on your complaint ${issue.issueId}.`,
    RESOLVED: `Your complaint ${issue.issueId} has been marked as resolved. Please verify the resolution.`,
    REJECTED: `Your complaint ${issue.issueId} was rejected. ${note ? `Reason: ${note}` : ''}`,
  };
  if (status && statusMessages[status]) {
    const type = status === 'RESOLVED' ? 'VERIFY_RESOLUTION' : status === 'REJECTED' ? 'ISSUE_REJECTED' : 'ISSUE_VERIFIED';
    await notify(issue.reportedBy, statusMessages[status], type, issue._id);
  }

  if (status === 'REJECTED' && note) issue.rejectionReason = note;
  await issue.save();

  res.json({ success: true, issue });
});

// @route POST /api/issues/:id/progress  (staff uploads a progress/after image + remark)
// @access Private (staff assigned to the issue)
const addProgressUpdate = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  if (!issue.assignedTo || issue.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'This task is not assigned to you.' });
  }

  const { remark, imageType = 'progress' } = req.body;

  if (req.file) {
    issue.images.push(toPublicImageUrl(req.file.filename, imageType));
  }
  if (remark) {
    issue.staffRemarks.push({ text: remark, addedBy: req.user._id });
  }
  if (issue.status === 'ASSIGNED') {
    issue.status = 'IN_PROGRESS';
    await logStatusChange(issue._id, 'ASSIGNED', 'IN_PROGRESS', req.user._id, 'Staff started work');
    await notify(issue.reportedBy, `Work has started on your complaint ${issue.issueId}.`, 'WORK_STARTED', issue._id);
  }

  await issue.save();
  res.json({ success: true, issue });
});

// @route POST /api/issues/:id/verify   (citizen confirms whether resolution actually fixed it)
// @access Private (owner citizen)
const verifyResolution = asyncHandler(async (req, res) => {
  const { confirmed, rating, comment, reasonIfNotFixed } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the reporter can verify this resolution.' });
  }
  if (issue.status !== 'RESOLVED') {
    return res.status(400).json({ success: false, message: 'This issue is not currently marked resolved.' });
  }

  await ResolutionFeedback.create({
    issue: issue._id,
    citizen: req.user._id,
    confirmed: Boolean(confirmed),
    rating: confirmed ? rating : null,
    comment: comment || '',
    reasonIfNotFixed: !confirmed ? reasonIfNotFixed || '' : '',
  });

  issue.citizenVerifiedAt = new Date();

  if (confirmed) {
    issue.citizenRating = rating || null;
    issue.citizenFeedback = comment || null;
    req.user.civicPoints += 5;
    await req.user.save();
  } else {
    const fromStatus = issue.status;
    issue.status = 'REOPENED';
    issue.reopenReason = reasonIfNotFixed || 'Citizen reported the issue still exists.';
    issue.reopenCount += 1;
    issue.resolvedAt = null;
    await logStatusChange(issue._id, fromStatus, 'REOPENED', req.user._id, issue.reopenReason);
  }

  await issue.save();
  res.json({ success: true, issue });
});

// @route POST /api/issues/:id/reopen  (alias, explicit reopen endpoint)
const reopenIssue = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

  if (issue.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to reopen this issue.' });
  }
  if (issue.status !== 'RESOLVED') {
    return res.status(400).json({ success: false, message: 'Only resolved issues can be reopened.' });
  }

  const fromStatus = issue.status;
  issue.status = 'REOPENED';
  issue.reopenReason = reason || 'Reopened.';
  issue.reopenCount += 1;
  issue.resolvedAt = null;
  await issue.save();
  await logStatusChange(issue._id, fromStatus, 'REOPENED', req.user._id, issue.reopenReason);

  res.json({ success: true, issue });
});

// @route GET /api/issues/mine
// @access Private
const getMyIssues = asyncHandler(async (req, res) => {
  const issues = await Issue.find({ reportedBy: req.user._id })
    .populate('department', 'name')
    .populate('assignedTo', 'name')
    .sort('-createdAt')
    .lean();
  res.json({ success: true, issues });
});

module.exports = {
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
};
