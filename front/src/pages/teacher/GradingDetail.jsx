import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, InputNumber, Input, Space, Tag, Divider, message, Spin, Alert, Modal, Progress } from 'antd'
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  SendOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import './GradingDetail.css'

const { TextArea } = Input

const GradingDetail = () => {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState({})
  const [comments, setComments] = useState({})
  const [saving, setSaving] = useState(false)
  const [releasing, setReleasing] = useState(false)

  useEffect(() => {
    fetchGradingData()
  }, [recordId])

  const fetchGradingData = async () => {
    try {
      setLoading(true)
      const response = await request.get(`/grading/student/${recordId}`)
      setData(response)
      
      const initialScores = {}
      const initialComments = {}
      response.questions.forEach(q => {
        if (q.teacherScore !== null && q.teacherScore !== undefined) {
          initialScores[q.questionId] = q.teacherScore
        }
        if (q.teacherComment) {
          initialComments[q.questionId] = q.teacherComment
        }
      })
      setScores(initialScores)
      setComments(initialComments)
    } catch (error) {
      console.error('Fetch grading data error:', error)
      message.error('加载评阅数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (questionId, value) => {
    if (value === null || value === undefined) {
      setScores(prev => {
        const newScores = { ...prev }
        delete newScores[questionId]
        return newScores
      })
      return
    }
    setScores(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleCommentChange = (questionId, value) => {
    setComments(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSaveGrade = async (questionId) => {
    const score = scores[questionId]
    if (score === undefined || score === null) {
      message.warning('请输入分数')
      return
    }

    if (score < 0) {
      message.warning('分数不能为负数')
      return
    }

    const question = data?.questions?.find(q => q.questionId === questionId)
    if (question && score > question.maxScore) {
      message.warning(`分数不能超过满分 ${question.maxScore} 分`)
      return
    }

    try {
      setSaving(true)
      await request.post('/grading/grade', {
        recordId: parseInt(recordId),
        questionId: questionId,
        teacherScore: score,
        teacherComment: comments[questionId] || ''
      })
      message.success('评分已保存')
      await fetchGradingData()
    } catch (error) {
      console.error('Save grade error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReleaseScores = async () => {
    const essayQuestions = data.questions.filter(q => q.type === 'essay')
    const ungraded = essayQuestions.filter(q => !q.isGraded)
    
    if (ungraded.length > 0) {
      message.warning(`还有 ${ungraded.length} 道主观题未评分`)
      return
    }

    Modal.confirm({
      title: '发布成绩',
      content: '确定要发布成绩吗？发布后学生将可以查看详细成绩。',
      okText: '确定发布',
      cancelText: '取消',
      onOk: async () => {
        try {
          setReleasing(true)
          await request.post('/grading/release', {
            recordId: parseInt(recordId)
          })
          message.success('成绩已发布')
          navigate('/teacher/grading')
        } catch (error) {
          console.error('Release scores error:', error)
          const errorMsg = error?.response?.data?.msg || error?.message || '发布失败'
          message.error(errorMsg)
        } finally {
          setReleasing(false)
        }
      }
    })
  }

  const canReleaseScores = () => {
    if (!data || !data.questions) return false
    if (data.record?.scoreReleased) return false
    
    const essayQuestions = data.questions.filter(q => q.type === 'essay')
    const allGraded = essayQuestions.every(q => q.isGraded)
    
    return essayQuestions.length === 0 || allGraded
  }

  const handlePrevQuestion = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextQuestion = () => {
    setCurrentIndex(prev => Math.min(data.questions.length - 1, prev + 1))
  }

  const getQuestionTypeText = (type) => {
    const typeMap = {
      'single': '单选题',
      'multiple': '多选题',
      'fill': '填空题',
      'essay': '简答题'
    }
    return typeMap[type] || type
  }

  const renderQuestion = () => {
    if (!data || !data.questions) return null
    
    const question = data.questions[currentIndex]
    if (!question) return null

    const isObjective = question.type === 'single' || question.type === 'multiple' || question.type === 'fill'
    const isEssay = question.type === 'essay'

    return (
      <div className="question-container">
        <div className="question-header">
          <Space>
            <span className="question-number">第 {currentIndex + 1} 题</span>
            <Tag color="blue">{getQuestionTypeText(question.type)}</Tag>
            <Tag color="orange">{question.maxScore} 分</Tag>
            {question.isGraded && <Tag color="success" icon={<CheckCircleOutlined />}>已评分</Tag>}
          </Space>
        </div>

        <div className="question-content">
          <div className="question-text">{question.content}</div>
          
          {question.options && (question.type === 'single' || question.type === 'multiple') && (
            <div className="question-options">
              {(() => {
                try {
                  const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options
                  if (Array.isArray(options)) {
                    return options.map((option, index) => (
                      <div key={index} className="option-item">
                        <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))
                  }
                } catch (e) {
                  console.error('Parse options error:', e)
                }
                return null
              })()}
            </div>
          )}
          
          {question.studentAnswer && (
            <div className="student-answer">
              <div className="answer-label">学生答案：</div>
              <div className="answer-content">{question.studentAnswer}</div>
            </div>
          )}

          {isObjective && (
            <div className="objective-result">
              <Divider />
              <div className="result-row">
                <span className="result-label">正确答案：</span>
                <span className="result-value">{question.correctAnswer}</span>
              </div>
              <div className="result-row">
                <span className="result-label">得分：</span>
                <span className={`result-value ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                  {question.score || 0} / {question.maxScore}
                </span>
              </div>
            </div>
          )}

          {isEssay && (
            <div className="essay-grading">
              <Divider />
              <div className="grading-row">
                <span className="grading-label">评分（满分 {question.maxScore} 分）：</span>
                <InputNumber
                  max={question.maxScore}
                  value={scores[question.questionId]}
                  onChange={(value) => handleScoreChange(question.questionId, value)}
                  style={{ width: 120 }}
                  precision={1}
                  placeholder="0"
                  status={scores[question.questionId] !== undefined && scores[question.questionId] !== null && scores[question.questionId] < 0 ? 'error' : undefined}
                />
                {scores[question.questionId] !== undefined && scores[question.questionId] !== null && scores[question.questionId] < 0 && (
                  <span style={{ color: '#ff4d4f', marginLeft: 8, fontSize: 12 }}>
                    分数不能为负数
                  </span>
                )}
              </div>
              <div className="grading-row">
                <span className="grading-label">评语：</span>
                <TextArea
                  value={comments[question.questionId]}
                  onChange={(e) => handleCommentChange(question.questionId, e.target.value)}
                  placeholder="请输入评语..."
                  rows={4}
                  style={{ marginTop: 8 }}
                />
              </div>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveGrade(question.questionId)}
                loading={saving}
                style={{ marginTop: 16 }}
              >
                保存评分
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderQuestionNav = () => {
    if (!data || !data.questions) return null

    const objectiveCount = data.questions.filter(q => 
      q.type === 'single' || q.type === 'multiple' || q.type === 'fill'
    ).length
    const essayCount = data.questions.filter(q => q.type === 'essay').length
    const gradedCount = data.questions.filter(q => q.isGraded).length
    const progress = (gradedCount / data.questions.length) * 100

    return (
      <div className="question-nav">
        <div className="nav-header">
          <div className="nav-title">题目列表</div>
          <Progress percent={progress} size="small" format={() => `${gradedCount}/${data.questions.length}`} />
        </div>
        <div className="nav-grid">
          {data.questions.map((q, index) => {
            const isObjective = q.type === 'single' || q.type === 'multiple' || q.type === 'fill'
            const isGraded = isObjective || q.isGraded
            const isPending = !isObjective && !q.isGraded
            
            return (
              <Button
                key={index}
                size="small"
                type={currentIndex === index ? 'primary' : 'default'}
                className={`nav-button ${isGraded ? 'graded' : ''} ${isPending ? 'pending' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </Button>
            )
          })}
        </div>
        <div className="nav-legend">
          <span><span className="legend-dot graded"></span> 已评分</span>
          <span><span className="legend-dot pending"></span> 待评分</span>
        </div>
        <Divider />
        <div className="nav-stats">
          <div>客观题：{objectiveCount} 道（自动评分）</div>
          <div>主观题：{essayCount} 道（需手动评分）</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="error-container">
        <Alert message="未找到评阅数据" type="error" />
      </div>
    )
  }

  return (
    <div className="grading-detail-container">
      <div className="page-header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/grading')}>
          返回列表
        </Button>
        <h1 className="page-title">
          <FileTextOutlined /> 评阅试卷 - {data.exam?.title}
        </h1>
        <div className="student-info">
          学生：{data.student?.name}
          {data.className && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {data.className}
            </Tag>
          )}
        </div>
      </div>

      <div className="grading-body">
        <div className="question-area">
          <Card className="question-card">
            {renderQuestion()}
            
            <div className="question-actions">
              <Button onClick={handlePrevQuestion} disabled={currentIndex === 0}>
                上一题
              </Button>
              <Button type="primary" onClick={handleNextQuestion} disabled={currentIndex === data.questions.length - 1}>
                下一题
              </Button>
            </div>
          </Card>
        </div>

        <div className="sidebar">
          {renderQuestionNav()}
          
          {canReleaseScores() && (
            <Card className="release-card">
              <div className="release-info">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div>所有主观题已评阅完成</div>
              </div>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleReleaseScores}
                loading={releasing}
                block
                size="large"
              >
                发布成绩
              </Button>
            </Card>
          )}
          
          {data.record?.scoreReleased && (
            <Card className="released-card">
              <Alert message="成绩已发布" type="success" showIcon />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default GradingDetail
