import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Radio, Checkbox, Input, message, Modal, Progress, Tag, Spin } from 'antd'
import { 
  ClockCircleOutlined, 
  FlagOutlined, 
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import './TakeExam.css'

const { TextArea } = Input

const TakeExam = () => {
  const { recordId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [markedQuestions, setMarkedQuestions] = useState(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [switchCount, setSwitchCount] = useState(0)

  useEffect(() => {
    fetchExamQuestions()
    setupAntiCheat()
    
    return () => {
      document.oncontextmenu = null
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [recordId])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      autoSaveAnswers()
    }, 30000)
    
    return () => clearInterval(autoSaveTimer)
  }, [answers])

  const fetchExamQuestions = async () => {
    try {
      setLoading(true)
      const response = await request.get(`/exam-records/questions/${recordId}`)
      
      setRecord(response.record)
      setQuestions(response.questions || [])
      
      const duration = response.record?.exam?.duration || 60
      setTimeLeft(duration * 60)
      
      const answerMap = {}
      const markedSet = new Set()
      
      response.questions.forEach(q => {
        if (q.studentAnswer) {
          answerMap[q.questionId] = q.studentAnswer
        }
        if (q.isMarked) {
          markedSet.add(q.questionId)
        }
      })
      
      setAnswers(answerMap)
      setMarkedQuestions(markedSet)
    } catch (error) {
      console.error('Fetch questions error:', error)
      message.error('获取题目失败')
    } finally {
      setLoading(false)
    }
  }

  const setupAntiCheat = () => {
    document.oncontextmenu = () => {
      message.warning('考试期间禁止右键操作')
      return false
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    window.addEventListener('beforeunload', (e) => {
      e.preventDefault()
      e.returnValue = ''
    })
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      setSwitchCount(prev => prev + 1)
      message.warning(`请勿切换页面！已记录第${switchCount + 1}次切屏行为`)
    }
  }

  const autoSaveAnswers = async () => {
    const currentQuestion = questions[currentIndex]
    if (!currentQuestion) return
    
    const answer = answers[currentQuestion.questionId]
    if (answer !== undefined) {
      try {
        await request.post('/exam-records/answer', {
          recordId: parseInt(recordId),
          questionId: currentQuestion.questionId,
          studentAnswer: answer
        })
      } catch (error) {
        console.error('Auto save error:', error)
      }
    }
  }

  const handleAnswerChange = (value) => {
    const currentQuestion = questions[currentIndex]
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionId]: value
    }))
  }

  const handleToggleMark = async () => {
    const currentQuestion = questions[currentIndex]
    const newMarked = new Set(markedQuestions)
    
    if (newMarked.has(currentQuestion.questionId)) {
      newMarked.delete(currentQuestion.questionId)
    } else {
      newMarked.add(currentQuestion.questionId)
    }
    
    setMarkedQuestions(newMarked)
    
    try {
      await request.post('/exam-records/toggle-mark', {
        recordId: parseInt(recordId),
        questionId: currentQuestion.questionId
      })
      message.success(newMarked.has(currentQuestion.questionId) ? '已标记' : '已取消标记')
    } catch (error) {
      console.error('Toggle mark error:', error)
    }
  }

  const handlePrevQuestion = async () => {
    await saveCurrentAnswer()
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextQuestion = async () => {
    await saveCurrentAnswer()
    setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))
  }

  const saveCurrentAnswer = async () => {
    const currentQuestion = questions[currentIndex]
    if (!currentQuestion) return
    
    const answer = answers[currentQuestion.questionId]
    if (answer === undefined) return
    
    try {
      await request.post('/exam-records/answer', {
        recordId: parseInt(recordId),
        questionId: currentQuestion.questionId,
        studentAnswer: answer
      })
    } catch (error) {
      console.error('Save answer error:', error)
    }
  }

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto) {
      const unanswered = questions.filter(q => !answers[q.questionId])
      if (unanswered.length > 0) {
        Modal.confirm({
          title: '提交确认',
          icon: <ExclamationCircleOutlined />,
          content: `您还有 ${unanswered.length} 道题目未作答，确定要提交吗？`,
          okText: '确定提交',
          cancelText: '继续答题',
          onOk: () => submitExam()
        })
        return
      }
    }
    
    await submitExam()
  }

  const submitExam = async () => {
    try {
      setSubmitting(true)
      await saveCurrentAnswer()
      
      await request.post('/exam-records/submit', {
        recordId: parseInt(recordId)
      })
      
      message.success('试卷提交成功！')
      navigate(`/student/exam-result/${recordId}`)
    } catch (error) {
      console.error('Submit exam error:', error)
      message.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  const renderQuestion = () => {
    const question = questions[currentIndex]
    if (!question) return null

    const questionNumber = currentIndex + 1
    const answer = answers[question.questionId]

    return (
      <div className="question-content">
        <div className="question-header">
          <span className="question-number">第 {questionNumber} 题</span>
          <Tag color="blue">{getQuestionTypeText(question.type)}</Tag>
          <Tag color="orange">{question.score} 分</Tag>
          {markedQuestions.has(question.questionId) && (
            <Tag color="red" icon={<FlagOutlined />}>已标记</Tag>
          )}
        </div>
        
        <div className="question-text">
          {question.content}
        </div>

        <div className="question-options">
          {question.type === 'single' && (
            <Radio.Group 
              value={answer} 
              onChange={(e) => handleAnswerChange(e.target.value)}
            >
              {renderOptions(question.options)}
            </Radio.Group>
          )}
          
          {question.type === 'multiple' && (
            <Checkbox.Group 
              value={answer ? answer.split(',') : []}
              onChange={(values) => handleAnswerChange(values.sort().join(','))}
            >
              {renderOptions(question.options)}
            </Checkbox.Group>
          )}
          
          {question.type === 'fill' && (
            <Input
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="请输入答案"
              size="large"
            />
          )}
          
          {question.type === 'essay' && (
            <TextArea
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="请输入答案"
              rows={6}
              maxLength={1000}
              showCount
            />
          )}
        </div>
      </div>
    )
  }

  const renderOptions = (options) => {
    if (!options) return null
    
    const optionList = typeof options === 'string' ? JSON.parse(options) : options
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    
    return optionList.map((option, index) => (
      <div key={index} className="option-item">
        {questions[currentIndex]?.type === 'single' ? (
          <Radio value={labels[index]}>
            <span className="option-label">{labels[index]}.</span>
            <span className="option-text">{option}</span>
          </Radio>
        ) : (
          <Checkbox value={labels[index]}>
            <span className="option-label">{labels[index]}.</span>
            <span className="option-text">{option}</span>
          </Checkbox>
        )}
      </div>
    ))
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

  const renderQuestionNav = () => {
    return (
      <div className="question-nav">
        <div className="nav-title">答题卡</div>
        <div className="nav-grid">
          {questions.map((q, index) => (
            <Button
              key={index}
              size="small"
              type={currentIndex === index ? 'primary' : 'default'}
              className={`nav-button ${answers[q.questionId] ? 'answered' : ''} ${markedQuestions.has(q.questionId) ? 'marked' : ''}`}
              onClick={() => {
                saveCurrentAnswer()
                setCurrentIndex(index)
              }}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        <div className="nav-legend">
          <span><span className="legend-dot answered"></span> 已答</span>
          <span><span className="legend-dot marked"></span> 标记</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载题目中..." />
      </div>
    )
  }

  const progress = (Object.keys(answers).length / questions.length) * 100

  return (
    <div className="take-exam-container">
      <div className="exam-header">
        <div className="exam-title">{record?.exam?.title}</div>
        <div className="exam-timer">
          <ClockCircleOutlined className="timer-icon" />
          <span className={`timer-text ${timeLeft < 600 ? 'warning' : ''}`}>
            剩余时间：{formatTime(timeLeft)}
          </span>
        </div>
        <div className="exam-progress">
          <Progress 
            percent={progress} 
            size="small"
            format={() => `${Object.keys(answers).length}/${questions.length}`}
          />
        </div>
      </div>

      <div className="exam-body">
        <div className="question-area">
          <Card className="question-card">
            {renderQuestion()}
            
            <div className="question-actions">
              <Button 
                icon={<FlagOutlined />}
                onClick={handleToggleMark}
                type={markedQuestions.has(questions[currentIndex]?.questionId) ? 'primary' : 'default'}
              >
                {markedQuestions.has(questions[currentIndex]?.questionId) ? '取消标记' : '标记题目'}
              </Button>
              
              <div className="nav-buttons">
                <Button 
                  icon={<LeftOutlined />}
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                >
                  上一题
                </Button>
                <Button 
                  type="primary"
                  icon={<RightOutlined />}
                  onClick={handleNextQuestion}
                  disabled={currentIndex === questions.length - 1}
                >
                  下一题
                </Button>
              </div>
              
              <Button 
                type="primary"
                danger
                icon={<CheckCircleOutlined />}
                onClick={() => handleSubmit(false)}
                loading={submitting}
              >
                提交试卷
              </Button>
            </div>
          </Card>
        </div>
        
        <div className="sidebar">
          {renderQuestionNav()}
        </div>
      </div>
    </div>
  )
}

export default TakeExam
