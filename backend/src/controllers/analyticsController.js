const Issue = require('../models/Issue');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

function resolveDateRange(range, from, to) {
  if (from || to) {
    return {
      $gte: from ? new Date(from) : new Date(0),
      $lte: to ? new Date(to) : new Date(),
    };
  }
  const now = new Date();
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range] || null;
  if (!days) return null; // 'all'
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { $gte: start, $lte: now };
}

// @route GET /api/analytics/overview?range=30d|7d|90d|1y|all&from&to
const getOverview = asyncHandler(async (req, res) => {
  const { range = 'all', from, to } = req.query;
  const dateRange = resolveDateRange(range, from, to);
  const match = dateRange ? { createdAt: dateRange } : {};

  const [totals, resolutionTimeAgg, reopenedCount, criticalCount, participation] = await Promise.all([
    Issue.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['REPORTED', 'UNDER_REVIEW']] }, 1, 0] } },
        },
      },
    ]),
    Issue.aggregate([
      { $match: { ...match, resolvedAt: { $ne: null } } },
      {
        $group: {
          _id: null,
          avgHours: { $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] } },
        },
      },
    ]),
    Issue.countDocuments({ ...match, status: 'REOPENED' }),
    Issue.countDocuments({ ...match, priority: 'CRITICAL', status: { $nin: ['RESOLVED', 'REJECTED'] } }),
    User.countDocuments({ role: 'citizen', ...(dateRange ? { createdAt: dateRange } : {}) }),
  ]);

  const t = totals[0] || { total: 0, resolved: 0, pending: 0 };
  const avgHours = resolutionTimeAgg[0]?.avgHours || 0;

  res.json({
    success: true,
    overview: {
      totalComplaints: t.total,
      resolvedComplaints: t.resolved,
      pendingComplaints: t.pending,
      reopenedComplaints: reopenedCount,
      resolutionRate: t.total ? Number(((t.resolved / t.total) * 100).toFixed(1)) : 0,
      avgResolutionTimeHours: Number(avgHours.toFixed(1)),
      criticalIssues: criticalCount,
      newCitizenParticipation: participation,
    },
  });
});

// @route GET /api/analytics/categories
const getCategoryAnalytics = asyncHandler(async (req, res) => {
  const data = await Issue.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
      },
    },
    { $project: { _id: 0, category: '$_id', count: 1, resolved: 1 } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, categories: data });
});

// @route GET /api/analytics/departments
const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const data = await Issue.aggregate([
    { $match: { department: { $ne: null } } },
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: '$dept' },
    { $project: { _id: 0, department: '$dept.name', total: 1, resolved: 1 } },
    { $sort: { total: -1 } },
  ]);
  res.json({ success: true, departments: data });
});

// @route GET /api/analytics/areas  (ward-wise)
const getAreaAnalytics = asyncHandler(async (req, res) => {
  const data = await Issue.aggregate([
    { $match: { ward: { $ne: '' } } },
    {
      $group: {
        _id: '$ward',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $nin: ['$status', ['RESOLVED', 'REJECTED']] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        ward: '$_id',
        total: 1,
        resolved: 1,
        pending: 1,
        resolutionRate: { $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 1] },
      },
    },
    { $sort: { total: -1 } },
  ]);
  res.json({ success: true, areas: data });
});

// @route GET /api/analytics/trends?months=6
const getTrends = asyncHandler(async (req, res) => {
  const months = Math.min(24, parseInt(req.query.months, 10) || 6);
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const data = await Issue.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        reported: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const trends = data.map((d) => ({
    month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
    reported: d.reported,
    resolved: d.resolved,
  }));

  res.json({ success: true, trends });
});

// @route GET /api/analytics/staff-performance
const getStaffPerformance = asyncHandler(async (req, res) => {
  const data = await Issue.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    {
      $group: {
        _id: '$assignedTo',
        totalAssigned: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        avgResolutionHours: {
          $avg: {
            $cond: [{ $ne: ['$resolvedAt', null] }, { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] }, null],
          },
        },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
    { $unwind: '$staff' },
    {
      $project: {
        _id: 0,
        staffId: '$_id',
        name: '$staff.name',
        totalAssigned: 1,
        completed: 1,
        avgResolutionHours: { $round: [{ $ifNull: ['$avgResolutionHours', 0] }, 1] },
      },
    },
    { $sort: { completed: -1 } },
  ]);
  res.json({ success: true, staffPerformance: data });
});

module.exports = {
  getOverview,
  getCategoryAnalytics,
  getDepartmentAnalytics,
  getAreaAnalytics,
  getTrends,
  getStaffPerformance,
};
