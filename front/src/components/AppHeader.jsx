import React from 'react'
import { Layout } from 'antd'
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { useNavigate } from 'react-router-dom'

const { Header } = Layout

const AppHeader = () => {
  const { collapsed, toggleSidebar } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const getRoleName = (role) => {
    const roleMap = {
      admin: '管理员',
      teacher: '教师',
      student: '学生'
    }
    return roleMap[role] || role
  }

  return (
    <Header style={{
      padding: '0 24px',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div
        style={{
          fontSize: 16,
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onClick={toggleSidebar}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: '#8c8c8c' }}>
          {getRoleName(user?.role)}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 4,
            transition: 'background 0.3s'
          }}
          onClick={() => navigate('/dashboard')}
        >
          <UserOutlined />
          <span>{user?.name}</span>
        </div>
      </div>
    </Header>
  )
}

export default AppHeader
