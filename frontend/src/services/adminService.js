import api from './api';

export const adminService = {
  getStatistics: () => api.get('/admin/statistics').then((r) => r.data),
  getAllIssues: () => api.get('/admin/issues').then((r) => r.data),
  getUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  createStaffOrAdmin: (data) => api.post('/admin/users', data).then((r) => r.data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  getDepartments: () => api.get('/admin/departments').then((r) => r.data),
  createDepartment: (data) => api.post('/admin/departments', data).then((r) => r.data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data).then((r) => r.data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`).then((r) => r.data),
  getDepartmentPerformance: () => api.get('/admin/departments/performance/summary').then((r) => r.data),
};
