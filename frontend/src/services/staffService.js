import api from './api';

export const staffService = {
  getMyTasks: (params) => api.get('/staff/tasks', { params }).then((r) => r.data),
  getTaskById: (id) => api.get(`/staff/tasks/${id}`).then((r) => r.data),
  acceptTask: (id) => api.put(`/staff/tasks/${id}`, {}).then((r) => r.data),
};
