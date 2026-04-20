import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Button, Space, message, Empty, Spin } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'
import './GradingList.css'

const GradingList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [gradingList, setGradingList] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    fetchGradingList()
  }, [pagination.current, pagination.pageSize])

  const fetchGradingList = async () => {
    try {
      setLoading(true)
      const response = await request.get('/grading/pending', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize
        }
      })
      setGradingList(response.list || [])
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }))
    } catch (error) {
      console.error('Fetch grading list error:', error)
      message.error('加载待评阅列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = (recordId) => {
    navigate(`/teacher/grading/${recordId}`)
  }

  const getGradingStatus = (record) => {
    if (record.gradingStatus === 'completed') {
      return <Tag color="success">评阅完成</Tag>
    } else if (record.gradingStatus === 'pending') {
      return <Tag color="processing">待评阅</Tag>
    }
    return <Tag color="default">未知状态</Tag>
  }

  const columns = [
    {
      title: '考试名称',
      dataIndex: ['exam', 'title'],
      key: 'examTitle',
      render: (title) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{title}</span>
        </Space>
      )
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 150,
      render: (className) => className ? (
        <Tag color="blue">{className}</Tag>
      ) : (
        <span style={{ color: '#999' }}>-</span>
      )
    },
    {
      title: '提交时间',
      dataIndex: ['record', 'submitTime'],
      key: 'submitTime',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => getGradingStatus(record.record)
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleGrade(record.record.id)}
        >
          评阅
        </Button>
      )
    }
  ]

  return (
    <div className="grading-list-container">
      <div className="page-header">
        <h1 className="page-title">
          <CheckCircleOutlined /> 待评阅试卷
        </h1>
      </div>

      <Card className="grading-card">
        <Spin spinning={loading} tip="加载中...">
          {gradingList.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无待评阅试卷"
            />
          ) : (
            <Table
              columns={columns}
              dataSource={gradingList}
              rowKey="record.id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize }))
                }
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default GradingList
