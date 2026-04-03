import React from 'react'
import { Outlet } from 'react-router-dom'
import { Layout as AntLayout } from 'antd'
import Sidebar from '@/components/Sidebar'
import AppHeader from '@/components/AppHeader'

const { Content } = AntLayout

const MainLayout = () => {
  return (
    <AntLayout>
      <Sidebar />
      <AntLayout>
        <AppHeader />
        <Content style={{ margin: 0, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default MainLayout
