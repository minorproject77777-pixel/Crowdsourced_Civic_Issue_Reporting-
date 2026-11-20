import api from './api';

export const issueService = {
  list: (params) => api.get('/issues', { params }).then((r) => r.data),
  getById: (id) => api.get(`/issues/${id}`).then((r) => r.data),
  mine: () => api.get('/issues/mine').then((r) => r.data),
  checkDuplicates: (data) =>
    api
      .post('/issues', { ...data, checkDuplicateOnly: 'true' })
      .then((r) => r.data),
  create: (formData) =>
    api
      .post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  update: (id, data) => api.put(`/issues/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/issues/${id}`).then((r) => r.data),
  upvote: (id) => api.post(`/issues/${id}/upvote`).then((r) => r.data),
  removeUpvote: (id) => api.delete(`/issues/${id}/upvote`).then((r) => r.data),
  addComment: (id, text) => api.post(`/issues/${id}/comments`, { text }).then((r) => r.data),
  assign: (id, data) => api.post(`/issues/${id}/assign`, data).then((r) => r.data),
  changeStatus: (id, data) => api.post(`/issues/${id}/status`, data).then((r) => r.data),
  addProgress: (id, formData) =>
    api
      .post(`/issues/${id}/progress`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  verifyResolution: (id, data) => api.post(`/issues/${id}/verify`, data).then((r) => r.data),
  reopen: (id, data) => api.post(`/issues/${id}/reopen`, data).then((r) => r.data),
};
