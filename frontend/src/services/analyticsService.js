import api from './api';

export const analyticsService = {
  getOverview: (params) => api.get('/analytics/overview', { params }).then((r) => r.data),
  getCategories: () => api.get('/analytics/categories').then((r) => r.data),
  getDepartments: () => api.get('/analytics/departments').then((r) => r.data),
  getAreas: () => api.get('/analytics/areas').then((r) => r.data),
  getTrends: (months) => api.get('/analytics/trends', { params: { months } }).then((r) => r.data),
  getStaffPerformance: () => api.get('/analytics/staff-performance').then((r) => r.data),
};
