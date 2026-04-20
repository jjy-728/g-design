import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Tag, Button, Empty, Spin } from 'antd'
import { FileTextOutlined, ClockCircleOutlined, TrophyOutlined, PlayCircleOutlined } from '@ant-design/icons'
import request from '@/utils/request'
import './ExamList.css'

const ExamList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await request.get('/exam-records/available')
      const pendingExams = (response || []).filter(exam => {
        if (!exam.record) return true
        return exam.record.status !== 'submitted'
      })
      setExams(pendingExams)
    } catch (error) {
      console.error('Fetch exams error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = (exam) => {
    navigate(`/student/exam-notice/${exam.id}`)
  }

  const getStatusTag = (record) => {
    if (!record) {
      return <Tag color="green">待考</Tag>
    }
    
    if (record.status === 'in_progress') {
      return <Tag color="processing">进行中</Tag>
    }
    
    return <Tag color="default">{record.status}</Tag>
  }

  return (
    <div className="exam-list-container">
      <div className="page-header">
        <h1 className="page-title">
          <FileTextOutlined /> 在线考试
        </h1>
      </div>

      <Spin spinning={loading}>
        {exams.length === 0 && !loading ? (
          <Empty description="暂无可参加的考试" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={exams}
            renderItem={(exam) => {
              const record = exam.record
              
              return (
                <List.Item>
                  <Card 
                    className="exam-card"
                    title={
                      <div className="exam-card-title">
                        <span>{exam.title}</span>
                        {getStatusTag(record)}
                      </div>
                    }
                  >
                    <div className="exam-info">
                      <div className="info-item">
                        <ClockCircleOutlined className="info-icon" />
                        <span>考试时长：{exam.duration}分钟</span>
                      </div>
                      <div className="info-item">
                        <TrophyOutlined className="info-icon" />
                        <span>总分：{exam.totalScore}分</span>
                      </div>
                      <div className="info-item">
                        <span>及格分：{exam.passScore}分</span>
                      </div>
                    </div>

                    <div className="exam-actions">
                      {!record && (
                        <Button 
                          type="primary" 
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleStartExam(exam)}
                          block
                        >
                          开始考试
                        </Button>
                      )}
                      {record && record.status === 'in_progress' && (
                        <Button 
                          type="primary" 
                          icon={<PlayCircleOutlined />}
                          onClick={() => navigate(`/student/take-exam/${record.id}`)}
                          block
                        >
                          继续答题
                        </Button>
                      )}
                    </div>
                  </Card>
                </List.Item>
              )
            }}
          />
        )}
      </Spin>
    </div>
  )
}

export default ExamList
