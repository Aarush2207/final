import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for AI calls
});

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  managerLogin:    (data) => api.post('/auth/manager/login', data),
  employeeLogin:   (data) => api.post('/auth/employee/login', data),
  employeeRegister:(data) => api.post('/auth/employee/register', data),
};

// ── Manager ──────────────────────────────────────────────────
export const managerAPI = {
  getEmployees:   (managerId) => api.get(`/manager/${managerId}/employees`),
  getStats:       (managerId) => api.get(`/manager/${managerId}/stats`),
  updateRole:     (managerId, employeeId, role_id) =>
    api.patch(`/manager/${managerId}/employees/${employeeId}/role`, { role_id }),
  deleteEmployee: (managerId, employeeId) =>
    api.delete(`/manager/${managerId}/employees/${employeeId}`),
  rankEmployees:  (managerId, roleId) =>
    api.post(`/manager/${managerId}/roles/${roleId}/rank`),
};

// ── Employees ────────────────────────────────────────────────
export const employeeAPI = {
  getProfile:   (id) => api.get(`/employees/${id}`),
  getDashboard: (id) => api.get(`/employees/${id}/dashboard`),
  update:       (id, data) => api.patch(`/employees/${id}`, data),
  addSkill:     (id, data) => api.post(`/employees/${id}/skills`, data),
  deleteSkill:  (id, skillId) => api.delete(`/employees/${id}/skills/${skillId}`),
  getAll:       (params) => api.get('/employees', { params }),
};

// ── Roles ────────────────────────────────────────────────────
export const rolesAPI = {
  getAll:   (params) => api.get('/roles', { params }),
  getById:  (id) => api.get(`/roles/${id}`),
  create:   (data) => api.post('/roles', data),
  update:   (id, data) => api.put(`/roles/${id}`, data),
  delete:   (id) => api.delete(`/roles/${id}`),
};

// ── Resume ───────────────────────────────────────────────────
export const resumeAPI = {
  parse: (formData) => api.post('/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000,
  }),
};

// ── Interviews ───────────────────────────────────────────────
export const interviewAPI = {
  generate:          (data) => api.post('/interview/generate', data),
  evaluate:          (data) => api.post('/interview/evaluate', data),
  save:              (data) => api.post('/interview/save', data),
  getForEmployee:    (id)   => api.get(`/interview/employee/${id}`),
  getForManager:     (id)   => api.get(`/interview/manager/${id}`),
};

export default api;
