import { message } from 'antd'

const TOKEN_KEY = 'g_design_token'
const USER_INFO_KEY = 'g_design_user_info'

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY)
  return userInfo ? JSON.parse(userInfo) : null
}

export const setUserInfo = (userInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export const removeUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY)
}

export const clearAuth = () => {
  removeToken()
  removeUserInfo()
}

export const isAuthenticated = () => {
  return !!getToken()
}

export const hasPermission = (requiredPermission) => {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.permissions) {
    return false
  }
  return userInfo.permissions.includes(requiredPermission)
}

export const hasRole = (requiredRole) => {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.role) {
    return false
  }
  return userInfo.role === requiredRole
}

export const showMessage = (type, content) => {
  message[type](content)
}
