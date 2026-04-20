import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Descriptions
} from 'antd'
import {
  TrophyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'
import './ExamHistory.css'

const ExamHistory = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await request.get('/exam-records/history')
      setHistory(response.list || [])
    } catch (error) {
      console.error('Fetch history error:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewResult = (recordId) => {
    navigate(`/student/exam-result/${recordId}`)
  }

  const formatTime = (seconds) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  }

  const getStatusTag = (record) => {
    if (!record.scoreReleased) {
      if (record.gradingStatus === 'pending') {
        return <Tag color="processing">评阅中</Tag>
      }
      return <Tag color="warning">待发布</Tag>
    }
    return record.isPassed ? (
      <Tag icon={<CheckCircleOutlined />} color="success">及格</Tag>
    ) : (
      <Tag color="error">不及格</Tag>
    )
  }

  const getScoreDisplay = (record) => {
    if (!record.scoreReleased) {
      return <span style={{ color: '#999' }}>-</span>
    }
    if (!record.totalScore) {
      return <span style={{ color: '#999' }}>-</span>
    }
    const exam = record.exam
    const score = record.totalScore
    const total = exam?.totalScore || 100
    const passScore = exam?.passScore || 60
    const color = score >= passScore ? '#52c41a' : '#ff4d4f'
    
    return (
      <Space>
        <span style={{ 
          color: color,
          fontWeight: 'bold',
          fontSize: 16
        }}>
          {score.toFixed(1)}
        </span>
        <span style={{ color: '#8c8c8c' }}>/ {total}</span>
      </Space>
    )
  }

  const columns = [
    {
      title: '考试名称',
      dataIndex: ['exam', 'title'],
      key: 'examTitle',
      render: (title) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{title || '-'}</span>
        </Space>
      )
    },
    {
      title: '得分',
      key: 'score',
      width: 150,
      render: (_, record) => getScoreDisplay(record)
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => getStatusTag(record)
    },
    {
      title: '用时',
      dataIndex: 'timeUsed',
      key: 'timeUsed',
      width: 120,
      render: (timeUsed) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <span>{formatTime(timeUsed)}</span>
        </Space>
      )
    },
    {
      title: '交卷时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewResult(record.id)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <div className="exam-history-container">
      <div className="page-header">
        <h1 className="page-title">
          <TrophyOutlined /> 考试记录
        </h1>
      </div>

      <Card className="history-card">
        <Spin spinning={loading} tip="加载中...">
          {history.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#999' }}>
                  暂无考试记录
                </span>
              }
            >
              <Button 
                type="primary" 
                onClick={() => navigate('/student/exams')}
              >
                去参加考试
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={history}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                pageSize: 10
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default ExamHistory
