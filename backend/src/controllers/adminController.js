const User = require('../models/User');
const Issue = require('../models/Issue');
const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/admin/statistics
const getStatistics = asyncHandler(async (req, res) => {
  const [totalIssues, resolvedIssues, activeIssues, criticalIssues, totalCitizens, byStatus] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: 'RESOLVED' }),
    Issue.countDocuments({ status: { $nin: ['RESOLVED', 'REJECTED'] } }),
    Issue.countDocuments({ priority: 'CRITICAL', status: { $nin: ['RESOLVED', 'REJECTED'] } }),
    User.countDocuments({ role: 'citizen' }),
    Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

  res.json({
    success: true,
    statistics: {
      totalIssues,
      resolvedIssues,
      activeIssues,
      criticalIssues,
      totalCitizens,
      pending: statusCounts.REPORTED || 0,
      verified: statusCounts.VERIFIED || 0,
      inProgress: statusCounts.IN_PROGRESS || 0,
      statusCounts,
    },
  });
});

// @route GET /api/admin/issues  (same as GET /api/issues but always full detail, admin-only convenience alias)
const getAllIssuesForAdmin = asyncHandler(async (req, res) => {
  const issues = await Issue.find()
    .populate('reportedBy', 'name email')
    .populate('department', 'name')
    .populate('assignedTo', 'name')
    .sort('-createdAt')
    .lean();
  res.json({ success: true, issues });
});

// @route GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  }
  const users = await User.find(query).populate('department', 'name').sort('-createdAt').lean();
  res.json({ success: true, users });
});

// @route POST /api/admin/users  (admin creates a staff or admin account)
const createStaffOrAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;
  if (!['staff', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'role must be staff or admin.' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
  }
  const user = await User.create({ name, email, password, role, department: department || null, phone });
  res.status(201).json({ success: true, user: user.toSafeJSON() });
});

// @route PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, role, department, isActive, ward } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department || null;
  if (isActive !== undefined) user.isActive = isActive;
  if (ward !== undefined) user.ward = ward;

  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});

// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User removed.' });
});

// -------- Departments --------

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort('name').lean();
  res.json({ success: true, departments });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, headName, contactEmail, contactPhone } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });

  const existing = await Department.findOne({ name });
  if (existing) return res.status(409).json({ success: false, message: 'A department with this name already exists.' });

  const department = await Department.create({ name, description, headName, contactEmail, contactPhone });
  res.status(201).json({ success: true, department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });

  ['name', 'description', 'headName', 'contactEmail', 'contactPhone', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) department[field] = req.body[field];
  });

  await department.save();
  res.json({ success: true, department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });

  const issuesUsingDept = await Issue.countDocuments({ department: department._id });
  if (issuesUsingDept > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete: ${issuesUsingDept} issue(s) are assigned to this department.`,
    });
  }

  await department.deleteOne();
  res.json({ success: true, message: 'Department removed.' });
});

// @route GET /api/admin/departments/performance
const getDepartmentPerformance = asyncHandler(async (req, res) => {
  const performance = await Issue.aggregate([
    { $match: { department: { $ne: null } } },
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        avgResolutionHours: {
          $avg: {
            $cond: [
              { $ne: ['$resolvedAt', null] },
              { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
              null,
            ],
          },
        },
      },
    },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
    { $unwind: '$department' },
    {
      $project: {
        _id: 0,
        departmentId: '$_id',
        name: '$department.name',
        total: 1,
        resolved: 1,
        resolutionRate: {
          $cond: [{ $eq: ['$total', 0] }, 0, { $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 1] }],
        },
        avgResolutionHours: { $round: [{ $ifNull: ['$avgResolutionHours', 0] }, 1] },
      },
    },
    { $sort: { total: -1 } },
  ]);

  res.json({ success: true, performance });
});

module.exports = {
  getStatistics,
  getAllIssuesForAdmin,
  getUsers,
  createStaffOrAdmin,
  updateUser,
  deleteUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentPerformance,
};
