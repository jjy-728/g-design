import axios from 'axios'
import { getToken, removeToken, removeUserInfo } from '@/utils/auth'
import { message } from 'antd'

const MOCK_MODE = false

const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '管理员',
    role: 'admin',
    email: 'admin@example.com',
    permissions: [
      'user:manage',
      'question:manage',
      'question:create',
      'question:edit',
      'question:delete',
      'exam:manage',
      'exam:create',
      'exam:edit',
      'exam:delete',
      'ai:generate',
      'result:view'
    ]
  },
  teacher: {
    id: 2,
    username: 'teacher',
    password: 'teacher123',
    name: '教师',
    role: 'teacher',
    email: 'teacher@example.com',
    permissions: [
      'question:manage',
      'question:create',
      'question:edit',
      'question:delete',
      'exam:manage',
      'exam:create',
      'exam:edit',
      'ai:generate',
      'result:view'
    ]
  },
  student: {
    id: 3,
    username: 'student',
    password: 'student123',
    name: '学生',
    role: 'student',
    email: 'student@example.com',
    permissions: [
      'exam:take',
      'result:view'
    ]
  }
}

const service = axios.create({
  baseURL: MOCK_MODE ? '' : '/api',
  timeout: 60000 // 增加到 60 秒以适配 AI 生成任务
})

service.interceptors.request.use(
  (config) => {
    if (!MOCK_MODE) {
      const token = getToken()
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    if (MOCK_MODE) {
      return response.data
    }
    
    const { code, data, msg } = response.data
    
    if (code === 200) {
      return data
    } else if (code === 401) {
      message.error('登录已过期，请重新登录')
      removeToken()
      removeUserInfo()
      window.location.href = '/login'
      return Promise.reject(new Error(msg || '未授权'))
    } else {
      message.error(msg || '请求失败')
      return Promise.reject(new Error(msg || '请求失败'))
    }
  },
  (error) => {
    console.error('Response error:', error)
    
    if (MOCK_MODE) {
      return Promise.reject(error)
    }
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          const errorMessage = data?.msg || msg || '未授权'
          message.error(errorMessage)
          
          if (window.location.pathname !== '/login') {
            removeToken()
            removeUserInfo()
            window.location.href = '/login'
          }
          break
        case 403:
          message.error('没有权限访问该资源')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(data?.msg || '请求失败')
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接')
    } else {
      message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

const mockRequest = {
  post: (url, data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (url === '/auth/login') {
          const user = mockUsers[data.username]
          if (user && user.password === data.password) {
            resolve({
              token: 'mock-token-' + Date.now(),
              user: user
            })
          } else {
            reject(new Error('用户名或密码错误'))
          }
        } else if (url === '/ai/generate-questions') {
          resolve({
            questions: Array.from({ length: data.count }, (_, i) => ({
              id: Date.now() + i,
              type: data.questionType,
              knowledgePoint: data.knowledgePoint,
              difficulty: data.difficulty,
              content: `这是关于${data.knowledgePoint}的第${i + 1}道${data.questionType === 'single' ? '单选' : data.questionType === 'multiple' ? '多选' : data.questionType === 'fill' ? '填空' : '简答'}题`,
              options: (data.questionType === 'single' || data.questionType === 'multiple') 
                ? ['选项A', '选项B', '选项C', '选项D'] 
                : undefined,
              answer: data.questionType === 'single' ? 'A' : (data.questionType === 'multiple' ? ['A', 'C'] : '示例答案'),
              explanation: '这是AI生成的题目解析'
            }))
          })
        } else if (url.startsWith('/questions')) {
          resolve({ success: true })
        } else if (url.startsWith('/exams')) {
          resolve({ success: true })
        } else if (url.startsWith('/users')) {
          resolve({ success: true })
        } else {
          resolve({ success: true })
        }
      }, 500)
    })
  },
  get: (url, params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (url === '/questions') {
          resolve({
            list: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              type: ['single', 'multiple', 'fill', 'essay'][i % 4],
              knowledgePoint: ['React', 'Vue', 'JavaScript', 'TypeScript'][i % 4],
              difficulty: (i % 5) + 1,
              content: `示例题目内容 ${i + 1}`,
              options: i % 4 < 2 ? ['选项A', '选项B', '选项C', '选项D'] : undefined,
              answer: 'A',
              explanation: '这是示例解析',
              createdAt: new Date().toISOString()
            })),
            total: 100
          })
        } else if (url === '/exams') {
          resolve({
            list: [
              {
                id: 1,
                title: 'React 基础测试',
                description: '测试 React 基础知识',
                duration: 60,
                totalScore: 100,
                questionCount: 20,
                passScore: 60,
                status: 'available',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 2,
                title: 'JavaScript 高级特性',
                description: '测试 JavaScript 高级特性',
                duration: 90,
                totalScore: 100,
                questionCount: 30,
                passScore: 60,
                status: 'upcoming',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            total: 2
          })
        } else if (url === '/exams/history') {
          resolve({
            list: [
              {
                id: 1,
                examTitle: 'React 基础测试',
                score: 85,
                totalScore: 100,
                passScore: 60,
                status: 'passed',
                duration: 1800,
                submitTime: new Date().toISOString(),
                details: []
              }
            ],
            total: 1
          })
        } else if (url.startsWith('/exams/')) {
          const examId = url.split('/')[2]
          resolve({
            exam: {
              id: examId,
              title: 'React 基础测试',
              description: '测试 React 基础知识',
              duration: 60,
              totalScore: 100,
              questionCount: 5,
              passScore: 60
            },
            questions: Array.from({ length: 5 }, (_, i) => ({
              id: i + 1,
              type: ['single', 'multiple', 'fill', 'essay'][i % 4],
              difficulty: (i % 5) + 1,
              score: 20,
              content: `第 ${i + 1} 题：这是关于 React 的题目内容`,
              options: i % 4 < 2 ? ['选项A', '选项B', '选项C', '选项D'] : undefined,
              answer: i % 4 < 2 ? 'A' : '示例答案'
            })),
            savedAnswers: {},
            markedQuestions: []
          })
        } else if (url === '/users') {
          resolve({
            list: [
              {
                id: 1,
                username: 'admin',
                name: '管理员',
                role: 'admin',
                email: 'admin@example.com',
                status: 'active',
                createdAt: new Date().toISOString()
              },
              {
                id: 2,
                username: 'teacher',
                name: '教师',
                role: 'teacher',
                email: 'teacher@example.com',
                status: 'active',
                createdAt: new Date().toISOString()
              },
              {
                id: 3,
                username: 'student',
                name: '学生',
                role: 'student',
                email: 'student@example.com',
                status: 'active',
                createdAt: new Date().toISOString()
              }
            ],
            total: 3
          })
        } else {
          resolve({})
        }
      }, 300)
    })
  },
  put: (url, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 300)
    })
  },
  delete: (url) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 300)
    })
  }
}

const request = MOCK_MODE ? mockRequest : service

export default request
