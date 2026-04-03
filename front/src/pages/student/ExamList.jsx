import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Descriptions
} from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'

const ExamList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await request.get('/exams')
      setExams(response.list || [])
    } catch (error) {
      console.error('Fetch exams error:', error)
      message.error('加载考试列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (exam) => {
    setSelectedExam(exam)
    setDetailModalVisible(true)
  }

  const handleStartExam = (exam) => {
    if (exam.status !== 'available') {
      message.warning('该考试暂不可用')
      return
    }
    
    Modal.confirm({
      title: '开始考试',
      content: `确定要开始《${exam.title}》吗？考试时长为 ${exam.duration} 分钟。`,
      okText: '开始考试',
      cancelText: '取消',
      onOk: () => {
        navigate(`/student/exam/${exam.id}`)
      }
    })
  }

  const getStatusTag = (status) => {
    const statusMap = {
      available: { text: '可参加', color: 'green' },
      completed: { text: '已完成', color: 'blue' },
      expired: { text: '已过期', color: 'default' },
      upcoming: { text: '未开始', color: 'orange' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FileTextOutlined /> 在线考试
        </h1>
      </div>

      <Card>
        <List
          loading={loading}
          dataSource={exams}
          renderItem={(exam) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  onClick={() => handleViewDetail(exam)}
                >
                  查看详情
                </Button>,
                exam.status === 'available' && (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartExam(exam)}
                  >
                    开始考试
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{exam.title}</span>
                    {getStatusTag(exam.status)}
                  </Space>
                }
                description={
                  <Space split={<span>|</span>}>
                    <span>
                      <ClockCircleOutlined /> 时长：{exam.duration} 分钟
                    </span>
                    <span>
                      <TrophyOutlined /> 总分：{exam.totalScore} 分
                    </span>
                    <span>
                      题目数量：{exam.questionCount} 题
                    </span>
                    {exam.startTime && (
                      <span>
                        开始时间：{dayjs(exam.startTime).format('YYYY-MM-DD HH:mm')}
                      </span>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="考试详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedExam?.status === 'available' && (
            <Button
              key="start"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setDetailModalVisible(false)
                handleStartExam(selectedExam)
              }}
            >
              开始考试
            </Button>
          )
        ]}
        width={700}
      >
        {selectedExam && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="考试标题">
              {selectedExam.title}
            </Descriptions.Item>
            <Descriptions.Item label="考试说明">
              {selectedExam.description || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="考试时长">
              {selectedExam.duration} 分钟
            </Descriptions.Item>
            <Descriptions.Item label="总分">
              {selectedExam.totalScore} 分
            </Descriptions.Item>
            <Descriptions.Item label="题目数量">
              {selectedExam.questionCount} 题
            </Descriptions.Item>
            <Descriptions.Item label="及格分数">
              {selectedExam.passScore} 分
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {selectedExam.startTime ? dayjs(selectedExam.startTime).format('YYYY-MM-DD HH:mm') : '不限'}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {selectedExam.endTime ? dayjs(selectedExam.endTime).format('YYYY-MM-DD HH:mm') : '不限'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(selectedExam.status)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ExamList
