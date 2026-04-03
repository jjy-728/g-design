import request from '@/utils/request'

export const authAPI = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  getUserInfo: () => request.get('/auth/user')
}

export const questionAPI = {
  getList: (params) => request.get('/questions', { params }),
  getById: (id) => request.get(`/questions/${id}`),
  create: (data) => request.post('/questions', data),
  update: (id, data) => request.put(`/questions/${id}`, data),
  delete: (id) => request.delete(`/questions/${id}`),
  batchDelete: (ids) => request.delete('/questions/batch', { data: { ids } }),
  export: () => request.get('/questions/export', { responseType: 'blob' }),
  import: (formData) => request.post('/questions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const aiAPI = {
  generateQuestions: (data) => request.post('/ai/generate-questions', data)
}

export const examAPI = {
  getList: (params) => request.get('/exams', { params }),
  getById: (id) => request.get(`/exams/${id}`),
  getHistory: (params) => request.get('/exams/history', { params }),
  submit: (id, data) => request.post(`/exams/${id}/submit`, data),
  saveAnswers: (id, data) => request.post(`/exams/${id}/save`, data)
}

export const userAPI = {
  getList: (params) => request.get('/users', { params }),
  getById: (id) => request.get(`/users/${id}`),
  create: (data) => request.post('/users', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  delete: (id) => request.delete(`/users/${id}`)
}
