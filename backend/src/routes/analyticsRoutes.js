const express = require('express');
const {
  getOverview,
  getCategoryAnalytics,
  getDepartmentAnalytics,
  getAreaAnalytics,
  getTrends,
  getStaffPerformance,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/overview', getOverview);
router.get('/categories', getCategoryAnalytics);
router.get('/departments', getDepartmentAnalytics);
router.get('/areas', getAreaAnalytics);
router.get('/trends', getTrends);
router.get('/staff-performance', getStaffPerformance);

module.exports = router;
