const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate('defaultDepartment', 'name').sort('name').lean();
  res.json({ success: true, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, defaultDepartment, categoryWeight } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

  const existing = await Category.findOne({ name });
  if (existing) return res.status(409).json({ success: false, message: 'This category already exists.' });

  const category = await Category.create({ name, icon, defaultDepartment: defaultDepartment || null, categoryWeight });
  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

  ['name', 'icon', 'defaultDepartment', 'categoryWeight', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });

  await category.save();
  res.json({ success: true, category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  await category.deleteOne();
  res.json({ success: true, message: 'Category removed.' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
