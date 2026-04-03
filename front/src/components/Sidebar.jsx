import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  RobotOutlined,
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'

const { Sider } = Layout

const Sidebar = () => {
  const { collapsed } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = useMemo(() => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '首页'
      }
    ]

    if (user?.role === 'admin') {
      items.push(
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: '用户管理'
        }
      )
    }

    if (user?.role === 'teacher') {
      items.push(
        {
          key: '/teacher/ai-generate',
          icon: <RobotOutlined />,
          label: 'AI 智能出题'
        },
        {
          key: '/teacher/question-bank',
          icon: <BookOutlined />,
          label: '题库管理'
        }
      )
    }

    if (user?.role === 'student') {
      items.push(
        {
          key: '/student/exams',
          icon: <FileTextOutlined />,
          label: '在线考试'
        },
        {
          key: '/student/history',
          icon: <HistoryOutlined />,
          label: '考试记录'
        }
      )
    }

    items.push({
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    })

    return items
  }, [user?.role])

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else {
      navigate(key)
    }
  }

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.startsWith('/teacher/ai-generate')) return '/teacher/ai-generate'
    if (path.startsWith('/teacher/question-bank')) return '/teacher/question-bank'
    if (path.startsWith('/student/exams')) return '/student/exams'
    if (path.startsWith('/student/history')) return '/student/history'
    if (path.startsWith('/admin/users')) return '/admin/users'
    return path
  }

  return (
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: collapsed ? 16 : 20,
        fontWeight: 'bold',
        background: '#001529'
      }}>
        {collapsed ? 'GD' : 'G-Design'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default Sidebar
