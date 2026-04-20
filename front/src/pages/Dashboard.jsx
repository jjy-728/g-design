import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import { UserOutlined, BookOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'
import request from '@/utils/request'

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])

  useEffect(() => {
    fetchStats()
  }, [user?.role])

  const fetchStats = async () => {
    if (!user?.role) return
    
    try {
      setLoading(true)
      const response = await request.get('/dashboard/stats')
      const data = formatStats(response)
      setStats(data)
    } catch (error) {
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatStats = (data) => {
    switch (user?.role) {
      case 'admin':
        return [
          { title: '用户总数', value: data.userCount || 0, icon: <UserOutlined /> },
          { title: '管理员', value: data.adminCount || 0, icon: <UserOutlined /> },
          { title: '教师数量', value: data.teacherCount || 0, icon: <BookOutlined /> },
          { title: '学生数量', value: data.studentCount || 0, icon: <CheckCircleOutlined /> },
          { title: '考试场次', value: data.examCount || 0, icon: <TrophyOutlined /> }
        ]
      case 'teacher':
        return [
          { title: '我的题目', value: data.questionCount || 0, icon: <BookOutlined /> },
          { title: '已发布考试', value: data.examCount || 0, icon: <TrophyOutlined /> },
          { title: '待批改试卷', value: data.pendingGradingCount || 0, icon: <CheckCircleOutlined /> },
          { title: '学生人数', value: data.studentCount || 0, icon: <UserOutlined /> }
        ]
      case 'student':
        return [
          { title: '已完成考试', value: data.completedExamCount || 0, icon: <TrophyOutlined /> },
          { title: '平均分数', value: data.avgScore ? data.avgScore.toFixed(1) : 0, icon: <CheckCircleOutlined /> },
          { title: '待参加考试', value: data.pendingExamCount || 0, icon: <BookOutlined /> }
        ]
      default:
        return []
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">欢迎回来，{user?.name}</h1>
      </div>
      
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.icon}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard
