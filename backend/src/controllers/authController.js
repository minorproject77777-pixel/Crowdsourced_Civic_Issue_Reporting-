const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');


function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// @route POST /api/auth/register
// @access Public — always creates a CITIZEN account. Admin/staff accounts are
// provisioned by an admin (see adminController.createStaffOrAdmin) or via the seed script.
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = await User.create({ name, email, phone, password, role: 'citizen' });
  const token = signToken(user._id);

  res.status(201).json({ success: true, token, user: user.toSafeJSON() });
});

// @route POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {

  const { email, password } = req.body || {};

  console.log('Login request body:', req.body); // Log the request body for debugging

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = signToken(user._id);
  res.json({ success: true, token, user: user.toSafeJSON() });
});

// @route GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

// @route PUT /api/auth/profile
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, ward, profileImage } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (ward !== undefined) req.user.ward = ward;
  if (profileImage !== undefined) req.user.profileImage = profileImage;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});

module.exports = { register, login, getMe, updateProfile };
