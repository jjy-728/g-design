import React from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { UserOutlined, BookOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()

  const getStats = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { title: '用户总数', value: 1234, icon: <UserOutlined /> },
          { title: '教师数量', value: 56, icon: <BookOutlined /> },
          { title: '学生数量', value: 1178, icon: <CheckCircleOutlined /> },
          { title: '考试场次', value: 89, icon: <TrophyOutlined /> }
        ]
      case 'teacher':
        return [
          { title: '我的题目', value: 234, icon: <BookOutlined /> },
          { title: '已发布考试', value: 12, icon: <TrophyOutlined /> },
          { title: '待批改试卷', value: 45, icon: <CheckCircleOutlined /> },
          { title: '学生人数', value: 120, icon: <UserOutlined /> }
        ]
      case 'student':
        return [
          { title: '已完成考试', value: 8, icon: <TrophyOutlined /> },
          { title: '平均分数', value: 85, icon: <CheckCircleOutlined /> },
          { title: '待参加考试', value: 2, icon: <BookOutlined /> },
          { title: '错题数量', value: 15, icon: <UserOutlined /> }
        ]
      default:
        return []
    }
  }

  const stats = getStats()

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">欢迎回来，{user?.name}</h1>
      </div>
      
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
    </div>
  )
}

export default Dashboard
