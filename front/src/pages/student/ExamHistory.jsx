import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Descriptions
} from 'antd'
import {
  TrophyOutlined,
  EyeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'

const ExamHistory = () => {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await request.get('/exams/history')
      setHistory(response.list || [])
    } catch (error) {
      console.error('Fetch history error:', error)
      message.error('加载考试记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (record) => {
    setSelectedRecord(record)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: '考试名称',
      dataIndex: 'examTitle',
      key: 'examTitle'
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score, record) => (
        <Space>
          <span style={{ 
            color: score >= record.passScore ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
            fontSize: 16
          }}>
            {score}
          </span>
          <span style={{ color: '#8c8c8c' }}>/ {record.totalScore}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        if (status === 'passed') {
          return <Tag icon={<CheckCircleOutlined />} color="success">及格</Tag>
        } else if (status === 'failed') {
          return <Tag color="error">不及格</Tag>
        } else {
          return <Tag color="default">{status}</Tag>
        }
      }
    },
    {
      title: '用时',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration) => `${Math.floor(duration / 60)}分${duration % 60}秒`
    },
    {
      title: '交卷时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <TrophyOutlined /> 考试记录
        </h1>
      </div>

      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={history}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="考试详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedRecord && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="考试名称" span={2}>
                {selectedRecord.examTitle}
              </Descriptions.Item>
              <Descriptions.Item label="得分">
                <Space>
                  <span style={{ 
                    color: selectedRecord.score >= selectedRecord.passScore ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold',
                    fontSize: 20
                  }}>
                    {selectedRecord.score}
                  </span>
                  <span style={{ color: '#8c8c8c' }}>/ {selectedRecord.totalScore}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="及格分数">
                {selectedRecord.passScore}
              </Descriptions.Item>
              <Descriptions.Item label="考试状态">
                {selectedRecord.status === 'passed' ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">及格</Tag>
                ) : (
                  <Tag color="error">不及格</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="用时">
                {Math.floor(selectedRecord.duration / 60)}分{selectedRecord.duration % 60}秒
              </Descriptions.Item>
              <Descriptions.Item label="交卷时间" span={2}>
                {dayjs(selectedRecord.submitTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Card title="答题详情" size="small">
              {selectedRecord.details?.map((detail, index) => (
                <div key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>第 {index + 1} 题</strong>
                    <Tag color="purple" style={{ marginLeft: 8 }}>{detail.score}分</Tag>
                    {detail.isCorrect !== undefined && (
                      <Tag color={detail.isCorrect ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                        {detail.isCorrect ? '正确' : '错误'}
                      </Tag>
                    )}
                    <span style={{ marginLeft: 8, color: '#8c8c8c' }}>得分：{detail.obtainedScore || 0}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>{detail.question}</div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#8c8c8c' }}>您的答案：</span>
                    <span style={{ color: detail.isCorrect ? '#52c41a' : '#ff4d4f' }}>
                      {Array.isArray(detail.userAnswer) ? detail.userAnswer.join(', ') : detail.userAnswer || '未作答'}
                    </span>
                  </div>
                  {detail.isCorrect !== undefined && (
                    <div>
                      <span style={{ color: '#8c8c8c' }}>正确答案：</span>
                      <span style={{ color: '#52c41a' }}>
                        {Array.isArray(detail.correctAnswer) ? detail.correctAnswer.join(', ') : detail.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ExamHistory
