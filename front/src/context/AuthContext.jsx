import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getToken, setToken, getUserInfo, setUserInfo, clearAuth } from '@/utils/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const userInfo = getUserInfo()
    
    if (token && userInfo) {
      setUser(userInfo)
    }
    
    setLoading(false)
  }, [])

  const login = useCallback((userData, token) => {
    setUser(userData)
    setToken(token)
    setUserInfo(userData)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    clearAuth()
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(userData)
    setUserInfo(userData)
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    hasPermission: (permission) => {
      return user?.permissions?.includes(permission) || false
    },
    hasRole: (role) => {
      return user?.role === role
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
