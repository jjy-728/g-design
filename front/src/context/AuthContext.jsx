import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, setToken, getUserInfo, setUserInfo, clearAuth } from '@/utils/auth'
import request from '@/utils/request'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const verifyToken = useCallback(async () => {
    const token = getToken()
    
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const freshUserInfo = await request.get('/user/current')
      const userWithRole = {
        ...freshUserInfo,
        role: freshUserInfo.roleName,
        permissions: freshUserInfo.permissions?.map(p => p.name) || []
      }
      setUser(userWithRole)
      setUserInfo(userWithRole)
    } catch (error) {
      console.error('Token verification failed:', error)
      clearAuth()
      setUser(null)
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    verifyToken()
  }, [verifyToken])

  const login = useCallback((userData, token) => {
    const userWithRole = {
      ...userData,
      role: userData.roleName,
      permissions: userData.permissions?.map(p => p.name) || userData.permissions || []
    }
    setUser(userWithRole)
    setToken(token)
    setUserInfo(userWithRole)
  }, [])

  const logout = useCallback(async () => {
    try {
        await request.post('/user/logout')
    } catch (error) {
        console.error('Logout API failed:', error)
    }
    setUser(null)
    clearAuth()
    navigate('/login', { replace: true })
}, [navigate])

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
