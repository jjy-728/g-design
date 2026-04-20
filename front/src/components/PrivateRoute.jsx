import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getToken } from '@/utils/auth'
import { Spin } from 'antd'

const PrivateRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, isAuthenticated, hasRole, hasPermission, loading } = useAuth()
  const hasToken = !!getToken()

  if (loading || (hasToken && !user)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="正在登录..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/403" replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />
  }

  return children
}

export default PrivateRoute
