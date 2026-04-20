import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Spin, Alert, Divider, Progress, Collapse } from 'antd'
import { 
  TrophyOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import './ExamResult.css'

const { Panel } = Collapse

const ExamResult = () => {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchResult()
  }, [recordId])

  const fetchResult = async () => {
    try {
      setLoading(true)
      const response = await request.get(`/exam-records/result/${recordId}`)
      setResult(response)
    } catch (error) {
      console.error('Fetch result error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  }

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100
    if (percentage >= 90) return '#52c41a'
    if (percentage >= 70) return '#1890ff'
    if (percentage >= 60) return '#faad14'
    return '#ff4d4f'
  }

  const getTypeName = (type) => {
    const typeMap = {
      'single': '单选题',
      'multiple': '多选题',
      'fill': '填空题',
      'essay': '简答题'
    }
    return typeMap[type] || type
  }

  const getTypeColor = (type) => {
    const colorMap = {
      'single': 'blue',
      'multiple': 'purple',
      'fill': 'orange',
      'essay': 'green'
    }
    return colorMap[type] || 'default'
  }

  const parseOptions = (options) => {
    if (!options) return []
    try {
      if (typeof options === 'string') {
        return JSON.parse(options)
      }
      return options
    } catch {
      return []
    }
  }

  const renderQuestionDetail = (question, index) => {
    const isObjective = question.type === 'single' || question.type === 'multiple' || question.type === 'fill'
    const score = isObjective ? question.score : question.teacherScore
    const isCorrect = question.isCorrect
    const options = parseOptions(question.options)

    return (
      <div key={question.questionId} className="question-detail-card">
        <div className="question-header">
          <div className="question-number">
            <Tag color={getTypeColor(question.type)}>{getTypeName(question.type)}</Tag>
            <span className="question-index">第 {index + 1} 题</span>
            <span className="question-score">（{question.maxScore}分）</span>
          </div>
          <div className="question-status">
            {isCorrect === null || isCorrect === undefined ? (
              <Tag color="processing">待评阅</Tag>
            ) : isCorrect ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>正确</Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
            )}
            <span className="score-text" style={{ color: score > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold', marginLeft: 8 }}>
              得分：{score !== null && score !== undefined ? score.toFixed(1) : '-'}
            </span>
          </div>
        </div>

        <div className="question-content">
          <div className="content-label">题目内容：</div>
          <div className="content-text">{question.content}</div>
        </div>

        {options.length > 0 && (
          <div className="question-options">
            <div className="content-label">选项：</div>
            <div className="options-list">
              {options.map((option, optIndex) => (
                <div key={optIndex} className="option-item">
                  <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                  <span className="option-text">{option}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="question-answer">
          <div className="answer-row">
            <div className="answer-item">
              <span className="answer-label">你的答案：</span>
              <span className={`answer-value ${isCorrect ? 'correct' : 'wrong'}`}>
                {question.studentAnswer || '未作答'}
              </span>
            </div>
            <div className="answer-item">
              <span className="answer-label">正确答案：</span>
              <span className="answer-value correct">{question.correctAnswer}</span>
            </div>
          </div>
        </div>

        {question.explanation && (
          <div className="question-explanation">
            <div className="content-label">答案解析：</div>
            <div className="explanation-text">{question.explanation}</div>
          </div>
        )}

        {question.teacherComment && (
          <div className="teacher-comment">
            <div className="content-label">教师评语：</div>
            <div className="comment-text">{question.teacherComment}</div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载成绩中..." />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="error-container">
        <Alert message="未找到成绩信息" type="error" />
      </div>
    )
  }

  const { record, questions, scoreReleased, message: resultMessage, exam } = result

  if (!scoreReleased) {
    return (
      <div className="exam-result-container">
        <div className="result-header">
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/student/exams')}
          >
            返回列表
          </Button>
          <h1 className="result-title">{exam?.title}</h1>
          <div></div>
        </div>

        <Card className="score-card">
          <div className="pending-status">
            <ClockCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 24 }} />
            <h2>成绩评阅中</h2>
            <p style={{ color: '#666', fontSize: 16 }}>
              {resultMessage || '您的试卷正在评阅中，请耐心等待教师发布成绩。'}
            </p>
            <Tag color="processing" style={{ marginTop: 16 }}>
              评阅状态：{record.gradingStatus === 'pending' ? '评阅中' : '已完成'}
            </Tag>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="exam-result-container">
      <div className="result-header">
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/student/exams')}
        >
          返回列表
        </Button>
        <h1 className="result-title">{exam?.title} - 成绩单</h1>
        <div></div>
      </div>

      <Card className="score-card">
        <div className="score-display">
          <div className="score-circle">
            <Progress 
              type="circle"
              percent={(record.totalScore / exam?.totalScore) * 100}
              format={() => (
                <div className="score-inner">
                  <div className="score-value" style={{ color: getScoreColor(record.totalScore, exam?.totalScore) }}>
                    {record.totalScore?.toFixed(1)}
                  </div>
                  <div className="score-total">/ {exam?.totalScore}分</div>
                </div>
              )}
              strokeColor={getScoreColor(record.totalScore, exam?.totalScore)}
              width={180}
            />
          </div>
          
          <div className="result-status">
            {record.isPassed ? (
              <div className="status-pass">
                <CheckCircleOutlined className="status-icon" />
                <span>恭喜通过！</span>
              </div>
            ) : (
              <div className="status-fail">
                <CloseCircleOutlined className="status-icon" />
                <span>未通过</span>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <Descriptions column={3} bordered>
          <Descriptions.Item label="考试时长">
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {exam?.duration}分钟
          </Descriptions.Item>
          <Descriptions.Item label="答题用时">
            {formatTime(record.timeUsed || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="及格分数">
            {exam?.passScore}分
          </Descriptions.Item>
          <Descriptions.Item label="客观题得分">
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {record.objectiveScore?.toFixed(1) || 0}分
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="主观题得分">
            <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
              {record.subjectiveScore?.toFixed(1) || 0}分
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="提交时间">
            {new Date(record.submitTime).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="detail-card" title={<span><TrophyOutlined /> 答题详情</span>}>
        <div className="questions-list">
          {questions && questions.map((question, index) => renderQuestionDetail(question, index))}
        </div>
      </Card>
    </div>
  )
}

export default ExamResult
