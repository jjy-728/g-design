import React, { useState } from 'react'
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
  Modal
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

const AIQuestionGenerator = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editForm] = Form.useForm()

  const questionTypes = [
    { value: 'single', label: '单选题' },
    { value: 'multiple', label: '多选题' },
    { value: 'fill', label: '填空题' },
    { value: 'essay', label: '简答题' }
  ]

  const handleGenerate = async (values) => {
    try {
      setLoading(true)
      
      const response = await request.post('/ai/generate-questions', {
        knowledgePoint: values.knowledgePoint,
        difficulty: values.difficulty,
        questionType: values.questionType,
        count: values.count
      })

      setGeneratedQuestions(response.questions || [])
      message.success(`成功生成 ${response.questions?.length || 0} 道题目`)
    } catch (error) {
      console.error('Generate questions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (question, index) => {
    setEditingQuestion({ ...question, index })
    editForm.setFieldsValue(question)
    setEditModalVisible(true)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      const updatedQuestions = [...generatedQuestions]
      updatedQuestions[editingQuestion.index] = values
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
        <div style={{ marginBottom: 12 }}>
          <strong>题目内容：</strong>
          <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            {question.content}
          </div>
        </div>
        {question.options && (
          <div>
            <strong>选项：</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {question.options.map((option, idx) => (
                <li key={idx}>
                  {String.fromCharCode(65 + idx)}. {option}
                </li>
              ))}
            </ul>
          </div>
        )}
        {question.answer && (
          <div style={{ marginTop: 12 }}>
            <strong>参考答案：</strong>
            <span style={{ color: '#52c41a', fontWeight: 500 }}>
              {question.answer}
            </span>
          </div>
        )}
        {question.explanation && (
          <div style={{ marginTop: 8 }}>
            <strong>解析：</strong>
            <span style={{ color: '#8c8c8c' }}>{question.explanation}</span>
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
                生成题目
              </Button>
              {generatedQuestions.length > 0 && (
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleRegenerate}
                >
                  重新生成
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {generatedQuestions.length > 0 && (
        <>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>题目预览 ({generatedQuestions.length} 道)</h2>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveAll}
            >
              全部保存到题库
            </Button>
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
            label="选项（每行一个）"
            name="options"
          >
            <TextArea rows={4} placeholder="A. 选项1&#10;B. 选项2&#10;C. 选项3&#10;D. 选项4" />
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
