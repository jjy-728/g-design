import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  message, 
  Spin,
  Divider,
  Modal,
  Tag
} from 'antd'
import { 
  RobotOutlined, 
  SaveOutlined, 
  EditOutlined, 
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import request from '@/utils/request'

const { TextArea } = Input
const { Option } = Select

const CACHE_KEY = 'ai_generated_questions'
const FORM_CACHE_KEY = 'ai_generate_form'
const LOADING_KEY = 'ai_generating_loading'

const AIQuestionGenerator = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(() => {
    const cached = sessionStorage.getItem(LOADING_KEY)
    return cached === 'true'
  })
  const [generatedQuestions, setGeneratedQuestions] = useState(() => {
    const cached = sessionStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  })
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editForm] = Form.useForm()
  
  const loadingRef = useRef(loading)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    loadingRef.current = loading
    if (loading) {
      sessionStorage.setItem(LOADING_KEY, 'true')
    } else {
      sessionStorage.removeItem(LOADING_KEY)
    }
  }, [loading])

  useEffect(() => {
    const formCache = sessionStorage.getItem(FORM_CACHE_KEY)
    if (formCache) {
      form.setFieldsValue(JSON.parse(formCache))
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    let pollInterval = null
    
    if (loading) {
      pollInterval = setInterval(() => {
        const cachedQuestions = sessionStorage.getItem(CACHE_KEY)
        const isLoading = sessionStorage.getItem(LOADING_KEY)
        
        if (cachedQuestions && isLoading !== 'true') {
          const questions = JSON.parse(cachedQuestions)
          if (questions.length > 0) {
            setGeneratedQuestions(questions)
            setLoading(false)
            message.success(`成功生成 ${questions.length} 道题目`)
          }
        }
      }, 500)
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [loading])

  useEffect(() => {
    if (generatedQuestions.length > 0) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(generatedQuestions))
    } else {
      sessionStorage.removeItem(CACHE_KEY)
    }
  }, [generatedQuestions])

  const questionTypes = [
    { value: 'single', label: '单选题' },
    { value: 'multiple', label: '多选题' },
    { value: 'fill', label: '填空题' },
    { value: 'essay', label: '简答题' }
  ]

  const handleGenerate = async (values) => {
    try {
      setLoading(true)
      sessionStorage.setItem(FORM_CACHE_KEY, JSON.stringify(values))
      
      const response = await request.post('/ai/generate-questions', {
        knowledgePoint: values.knowledgePoint,
        difficulty: values.difficulty,
        questionType: values.questionType,
        count: values.count
      })

      const cleanedQuestions = (response.questions || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) 
          ? q.options.map(o => o.replace(/^[A-Z][.．\s]+/, '').trim())
          : q.options,
        answer: (q.type === 'single' || q.type === 'multiple') && typeof q.answer === 'string'
          ? q.answer.split(/[.．\s]+/).shift().toUpperCase()
          : q.answer
      }))

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cleanedQuestions))
      sessionStorage.removeItem(LOADING_KEY)
      
      setGeneratedQuestions(cleanedQuestions)
      setLoading(false)
      message.success(`成功生成 ${cleanedQuestions.length} 道题目`)
    } catch (error) {
      console.error('Generate questions error:', error)
      sessionStorage.removeItem(LOADING_KEY)
      setLoading(false)
    }
  }

  const handleEdit = (question, index) => {
    setEditingQuestion({ ...question, index })
    // 回显时给选项加上 A. B. C. 前缀
    let optionsText = ''
    if (Array.isArray(question.options)) {
      optionsText = question.options
        .filter(o => o.trim())
        .map((option, idx) => {
          const prefix = String.fromCharCode(65 + idx) + '. '
          if (option.trim().startsWith(prefix)) {
            return option.trim()
          }
          return prefix + option.trim()
        })
        .join('\n')
    }
    editForm.setFieldsValue({
      ...question,
      options: optionsText
    })
    setEditModalVisible(true)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      const updatedQuestions = [...generatedQuestions]
      
      // 处理选项，将换行字符串转回数组
      const processedOptions = typeof values.options === 'string' 
        ? values.options.split('\n').filter(o => o.trim()).map(o => {
            // 清理编辑时手动输入的 A. B. 前缀
            return o.replace(/^[A-Z][.．\s]+/, '').trim()
          })
        : values.options

      updatedQuestions[editingQuestion.index] = {
        ...editingQuestion,
        ...values,
        options: processedOptions
      }
      
      setGeneratedQuestions(updatedQuestions)
      setEditModalVisible(false)
      message.success('题目编辑成功')
    } catch (error) {
      console.error('Edit question error:', error)
    }
  }

  const handleSaveToBank = async (question) => {
    try {
      await request.post('/questions', question)
      message.success('题目已保存到题库')
    } catch (error) {
      console.error('Save question error:', error)
    }
  }

  const handleSaveAll = async () => {
    try {
      await request.post('/questions/batch', { questions: generatedQuestions })
      message.success('所有题目已保存到题库')
      setGeneratedQuestions([])
      sessionStorage.removeItem(CACHE_KEY)
      sessionStorage.removeItem(FORM_CACHE_KEY)
      form.resetFields()
    } catch (error) {
      console.error('Save all questions error:', error)
    }
  }

  const handleRegenerate = () => {
    setGeneratedQuestions([])
    form.submit()
  }

  const renderQuestionPreview = (question, index) => {
    return (
      <Card 
        key={index} 
        size="small" 
        style={{ marginBottom: 16 }}
        title={`题目 ${index + 1} - ${questionTypes.find(t => t.value === question.type)?.label}`}
        extra={
          <Space>
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(question, index)}
            >
              编辑
            </Button>
            <Button 
              type="link" 
              icon={<SaveOutlined />} 
              onClick={() => handleSaveToBank(question)}
            >
              保存
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <strong>知识点：</strong> {question.knowledgePoint}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>难度：</strong> {question.difficulty} 级
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong style={{ display: 'inline-block', marginBottom: 8 }}>题目内容：</strong>
          <div style={{ 
            padding: 12, 
            background: '#f5f5f5', 
            borderRadius: 4,
            lineHeight: 1.6,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {question.content}
          </div>
        </div>
        {question.options && question.options.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong style={{ display: 'inline-block', marginBottom: 8 }}>选项：</strong>
            <div>
              {question.options.map((option, idx) => {
                const prefix = String.fromCharCode(65 + idx)
                // 如果 AI 还是带了前缀，我们尝试清理掉重复显示的
                const prefixWithDot = prefix + '. '
                const displayOption = option.startsWith(prefixWithDot) 
                  ? option.substring(prefixWithDot.length) 
                  : option
                const isCorrect = (question.type === 'single' || question.type === 'multiple') 
                  && question.answer.toUpperCase().includes(prefix)
                return (
                  <div key={idx} style={{ 
                    marginBottom: 8, 
                    padding: '10px 12px',
                    borderRadius: 4,
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    background: isCorrect ? '#f6ffed' : '#fafafa',
                    border: isCorrect ? '1px solid #b7eb8f' : '1px solid #e8e8e8'
                  }}>
                    <span style={{ 
                      fontWeight: isCorrect ? 600 : 500,
                      color: isCorrect ? '#52c41a' : '#333',
                      marginRight: 4
                    }}>
                      {prefix}.
                    </span>
                    {displayOption}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {question.answer && (
          <div style={{ marginBottom: question.explanation ? 8 : 0 }}>
            <Tag color="success" style={{ marginBottom: question.explanation ? 0 : undefined }}>
              参考答案：{question.type === 'single' || question.type === 'multiple' 
                ? question.answer.toUpperCase().split(/[.．\s]+/).shift() 
                : question.answer}
            </Tag>
          </div>
        )}
        {question.explanation && (
          <div style={{
            lineHeight: 1.6,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            <strong>解析：</strong>
            <span style={{ color: '#666' }}>{question.explanation}</span>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <RobotOutlined /> AI 智能出题
        </h1>
      </div>

      <Card title="生成条件" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          initialValues={{
            difficulty: 3,
            questionType: 'single',
            count: 5
          }}
        >
          <Form.Item
            label="知识点"
            name="knowledgePoint"
            rules={[{ required: true, message: '请输入知识点' }]}
          >
            <Input placeholder="例如：React 组件生命周期" />
          </Form.Item>

          <Form.Item
            label="难度等级"
            name="difficulty"
            rules={[{ required: true, message: '请选择难度等级' }]}
          >
            <Select>
              {[1, 2, 3, 4, 5].map(level => (
                <Option key={level} value={level}>
                  {level} 级
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="题型"
            name="questionType"
            rules={[{ required: true, message: '请选择题型' }]}
          >
            <Select>
              {questionTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="生成数量"
            name="count"
            rules={[{ required: true, message: '请输入生成数量' }]}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<RobotOutlined />}
                loading={loading}
              >
                {generatedQuestions.length > 0 ? '生成新题目' : '生成题目'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {generatedQuestions.length > 0 && (
        <>
          <Divider />

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                已生成 {generatedQuestions.length} 道题目
              </h3>
            </div>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleRegenerate}
              >
                重新生成（同参数）
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSaveAll}
              >
                全部保存到题库
              </Button>
            </Space>
          </div>
          <Spin spinning={loading}>
            {generatedQuestions.map((question, index) => renderQuestionPreview(question, index))}
          </Spin>
        </>
      )}

      <Modal
        title="编辑题目"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        width={800}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="题目内容"
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="选项（每行一个，字母前缀自动添加）"
            name="options"
          >
            <TextArea 
              rows={4} 
              placeholder="选项内容直接输入即可，自动添加 A. B. C. 前缀&#10;例如：&#10;选项1&#10;选项2&#10;选项3&#10;选项4" 
            />
          </Form.Item>

          <Form.Item
            label="参考答案"
            name="answer"
            rules={[{ required: true, message: '请输入参考答案' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="解析"
            name="explanation"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AIQuestionGenerator
