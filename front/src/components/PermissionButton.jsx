import React from 'react'
import { Button } from 'antd'
import { useAuth } from '@/context/AuthContext'

const PermissionButton = ({ permission, role, children, ...props }) => {
  const { hasPermission, hasRole } = useAuth()

  const hasAccess = () => {
    if (permission && !hasPermission(permission)) {
      return false
    }
    if (role && !hasRole(role)) {
      return false
    }
    return true
  }

  if (!hasAccess()) {
    return null
  }

  return <Button {...props}>{children}</Button>
}

export default PermissionButton
