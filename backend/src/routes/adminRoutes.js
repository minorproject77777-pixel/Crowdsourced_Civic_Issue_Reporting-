const express = require('express');
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/statistics', getStatistics);
router.get('/issues', getAllIssuesForAdmin);

router.get('/users', getUsers);
router.post('/users', createStaffOrAdmin);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);
router.get('/departments/performance/summary', getDepartmentPerformance);

module.exports = router;
