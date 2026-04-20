import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Checkbox, message, Spin, Alert, Divider } from 'antd'
import { ClockCircleOutlined, TrophyOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons'
import request from '@/utils/request'
import './ExamNotice.css'

const ExamNotice = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [record, setRecord] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchExamInfo()
  }, [examId])

  const fetchExamInfo = async () => {
    try {
      setLoading(true)
      const response = await request.get(`/exam-records/exam/${examId}`)
      setExam(response.exam)
      setRecord(response.record)
    } catch (error) {
      console.error('Fetch exam info error:', error)
      message.error('获取考试信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = async () => {
    if (!agreed) {
      message.warning('请先阅读并同意考试须知')
      return
    }

    try {
      setStarting(true)
      const response = await request.post('/exam-records/start', {
        examId: parseInt(examId)
      })
      message.success('考试开始，祝您取得好成绩！')
      navigate(`/student/take-exam/${response.id}`)
    } catch (error) {
      console.error('Start exam error:', error)
      message.error(error.message || '开始考试失败')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="error-container">
        <Alert message="考试不存在" type="error" />
      </div>
    )
  }

  if (record && record.status === 'submitted') {
    return (
      <div className="error-container">
        <Alert 
          message="您已完成此考试" 
          type="info"
          action={
            <Button onClick={() => navigate(`/student/exam-result/${record.id}`)}>
              查看成绩
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="exam-notice-container">
      <Card className="notice-card">
        <h1 className="notice-title">{exam.title} - 考试须知</h1>
        
        <Divider />
        
        <div className="exam-basic-info">
          <div className="info-row">
            <ClockCircleOutlined className="info-icon" />
            <span>考试时长：<strong>{exam.duration}分钟</strong></span>
          </div>
          <div className="info-row">
            <TrophyOutlined className="info-icon" />
            <span>试卷总分：<strong>{exam.totalScore}分</strong></span>
          </div>
          <div className="info-row">
            <span>及格分数：<strong>{exam.passScore}分</strong></span>
          </div>
        </div>

        <Divider />

        <div className="notice-content">
          <h2><WarningOutlined /> 考试规则</h2>
          <ul>
            <li>请确保网络连接稳定，避免因网络问题导致答案丢失</li>
            <li>考试过程中系统会自动保存您的答案，建议每答完一题就进行确认</li>
            <li>考试时间到后将自动提交试卷，请合理安排答题时间</li>
            <li>请认真作答，诚信考试，杜绝作弊行为</li>
          </ul>

          <h2><CheckCircleOutlined /> 注意事项</h2>
          <ul>
            <li>考试过程中请勿刷新页面或关闭浏览器</li>
            <li>请勿切换到其他应用或网页，系统会记录切屏行为</li>
            <li>如遇技术问题，请及时联系监考老师</li>
            <li>答题完成后，请点击"提交试卷"按钮完成考试</li>
          </ul>

          <h2>答题说明</h2>
          <ul>
            <li>单选题：选择一个正确答案</li>
            <li>多选题：选择所有正确答案，多选或少选均不得分</li>
            <li>填空题：在输入框中填写答案</li>
            <li>简答题：在文本框中输入答案，注意字数限制</li>
          </ul>
        </div>

        <Divider />

        <div className="agreement-section">
          <Checkbox 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          >
            我已认真阅读并同意遵守以上考试规则和注意事项
          </Checkbox>
        </div>

        <div className="action-buttons">
          <Button 
            size="large"
            onClick={() => navigate('/student/exams')}
          >
            返回列表
          </Button>
          <Button 
            type="primary" 
            size="large"
            disabled={!agreed}
            loading={starting}
            onClick={handleStartExam}
          >
            开始考试
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ExamNotice
