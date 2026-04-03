import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Radio,
  Checkbox,
  Input,
  Space,
  message,
  Modal,
  Result,
  Tag,
  Badge,
  Tooltip,
  Divider
} from 'antd'
import {
  ClockCircleOutlined,
  StarOutlined,
  StarFilled,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'

const TakeExam = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [markedQuestions, setMarkedQuestions] = useState(new Set())
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchExam()
  }, [id])

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeLeft, showResult])

  useEffect(() => {
    if (Object.keys(answers).length > 0 && !showResult) {
      const saveTimer = setTimeout(() => {
        saveAnswers()
      }, 5000)

      return () => clearTimeout(saveTimer)
    }
  }, [answers, showResult])

  const fetchExam = async () => {
    try {
      setLoading(true)
      const response = await request.get(`/exams/${id}`)
      setExam(response.exam)
      setQuestions(response.questions)
      setTimeLeft(response.exam.duration * 60)
      
      if (response.savedAnswers) {
        setAnswers(response.savedAnswers)
      }
      
      if (response.markedQuestions) {
        setMarkedQuestions(new Set(response.markedQuestions))
      }
    } catch (error) {
      console.error('Fetch exam error:', error)
      message.error('加载考试失败')
      navigate('/student/exams')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswers = async () => {
    try {
      await request.post(`/exams/${id}/save`, {
        answers,
        markedQuestions: Array.from(markedQuestions)
      })
    } catch (error) {
      console.error('Save answers error:', error)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleMarkQuestion = (questionId) => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const response = await request.post(`/exams/${id}/submit`, {
        answers
      })
      
      setResult(response)
      setShowResult(true)
      message.success('交卷成功')
    } catch (error) {
      console.error('Submit exam error:', error)
      message.error('交卷失败')
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
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const renderQuestion = (question, index) => {
    const isMarked = markedQuestions.has(question.id)
    const userAnswer = answers[question.id]

    return (
      <Card
        key={question.id}
        style={{ marginBottom: 24 }}
        title={
          <Space>
            <span>第 {index + 1} 题</span>
            <Tag color="blue">{question.type === 'single' ? '单选题' : question.type === 'multiple' ? '多选题' : question.type === 'fill' ? '填空题' : '简答题'}</Tag>
            <Tag color="orange">{question.difficulty}级</Tag>
            <Tag color="purple">{question.score}分</Tag>
            {isMarked && <Tag color="red">已标记</Tag>}
          </Space>
        }
        extra={
          <Tooltip title={isMarked ? '取消标记' : '标记为疑难题目'}>
            <Button
              type="text"
              icon={isMarked ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={() => handleMarkQuestion(question.id)}
            >
              {isMarked ? '已标记' : '标记'}
            </Button>
          </Tooltip>
        }
      >
        <div style={{ marginBottom: 16, fontSize: 16 }}>
          {question.content}
        </div>

        {question.type === 'single' && (
          <Radio.Group
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option, idx) => (
                <Radio key={idx} value={String.fromCharCode(65 + idx)}>
                  {String.fromCharCode(65 + idx)}. {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}

        {question.type === 'multiple' && (
          <Checkbox.Group
            value={userAnswer || []}
            onChange={(value) => handleAnswerChange(question.id, value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option, idx) => (
                <Checkbox key={idx} value={String.fromCharCode(65 + idx)}>
                  {String.fromCharCode(65 + idx)}. {option}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        )}

        {question.type === 'fill' && (
          <Input
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="请输入答案"
            size="large"
          />
        )}

        {question.type === 'essay' && (
          <Input.TextArea
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="请输入答案"
            rows={6}
          />
        )}
      </Card>
    )
  }

  const renderQuestionNav = () => {
    return (
      <Card title="答题卡" style={{ position: 'sticky', top: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {questions.map((question, index) => {
            const isAnswered = answers[question.id]
            const isMarked = markedQuestions.has(question.id)
            const isCurrent = index === currentQuestionIndex

            return (
              <Badge
                key={question.id}
                dot={isMarked}
                offset={[-5, 5]}
              >
                <Button
                  size="small"
                  type={isCurrent ? 'primary' : 'default'}
                  style={{
                    width: '100%',
                    backgroundColor: isAnswered && !isCurrent ? '#52c41a' : undefined,
                    borderColor: isAnswered && !isCurrent ? '#52c41a' : undefined
                  }}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              </Badge>
            )
          })}
        </div>
        
        <Divider />
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <div>
            <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#52c41a', marginRight: 4 }} />
            已答题
          </div>
          <div>
            <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#d9d9d9', marginRight: 4 }} />
            未答题
          </div>
          <div>
            <Badge dot offset={[0, 0]}>
              <span>已标记</span>
            </Badge>
          </div>
        </div>
      </Card>
    )
  }

  const renderResult = () => {
    return (
      <Result
        status="success"
        title="考试已完成"
        subTitle={`您的得分：${result?.score || 0} / ${exam?.totalScore || 0}`}
        extra={[
          <Button key="back" type="primary" onClick={() => navigate('/student/history')}>
            查看考试记录
          </Button>
        ]}
      >
        <Card title="答题详情" style={{ marginTop: 24 }}>
          {questions.map((question, index) => {
            const userAnswer = answers[question.id]
            const isCorrect = result?.details?.[question.id]?.isCorrect
            const score = result?.details?.[question.id]?.score || 0

            return (
              <div key={question.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>第 {index + 1} 题</strong>
                  <Tag color="purple" style={{ marginLeft: 8 }}>{question.score}分</Tag>
                  {isCorrect !== undefined && (
                    <Tag color={isCorrect ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                      {isCorrect ? '正确' : '错误'}
                    </Tag>
                  )}
                  <span style={{ marginLeft: 8, color: '#8c8c8c' }}>得分：{score}</span>
                </div>
                <div style={{ marginBottom: 8 }}>{question.content}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>您的答案：</span>
                  <span style={{ color: isCorrect ? '#52c41a' : '#ff4d4f' }}>
                    {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || '未作答'}
                  </span>
                </div>
                {isCorrect !== undefined && (
                  <div>
                    <span style={{ color: '#8c8c8c' }}>正确答案：</span>
                    <span style={{ color: '#52c41a' }}>
                      {Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      </Result>
    )
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}>加载中...</div>
  }

  if (showResult) {
    return renderResult()
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/exams')}>
            返回
          </Button>
          <h1 style={{ margin: 0 }}>{exam?.title}</h1>
        </Space>
        <Space>
          <Badge count={markedQuestions.size} overflowCount={99}>
            <Tag icon={<StarOutlined />} color="orange">
              已标记
            </Tag>
          </Badge>
          <Tag icon={<ClockCircleOutlined />} color="blue">
            剩余时间：{formatTime(timeLeft)}
          </Tag>
          <Tag icon={<SaveOutlined />} color="green">
            自动保存
          </Tag>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          {questions.map((question, index) => {
            if (index === currentQuestionIndex) {
              return renderQuestion(question, index)
            }
            return null
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              上一题
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => {
                Modal.confirm({
                  title: '确认交卷',
                  content: '交卷后将无法继续答题，确定要交卷吗？',
                  okText: '确定交卷',
                  cancelText: '取消',
                  onOk: handleSubmit
                })
              }}
              loading={submitting}
            >
              提交试卷
            </Button>
            <Button
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            >
              下一题
            </Button>
          </div>
        </div>

        <div style={{ width: 280 }}>
          {renderQuestionNav()}
        </div>
      </div>
    </div>
  )
}

export default TakeExam
