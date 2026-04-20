import React, { useState, useEffect } from 'react'
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
  Row,
  Col,
  Tag,
  Table,
  Modal,
  Popconfirm,
  Tooltip
} from 'antd'
import {
  SwapOutlined,
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const { TextArea } = Input
const { Option } = Select

const ExamGenerator = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [examInfo, setExamInfo] = useState(null)
  const [examList, setExamList] = useState([])
  const [examListLoading, setExamListLoading] = useState(false)
  const [viewExamVisible, setViewExamVisible] = useState(false)
  const [viewingExam, setViewingExam] = useState(null)
  const [viewingExamQuestions, setViewingExamQuestions] = useState([])

  const questionTypes = [
    { value: 'single', label: '单选题', defaultScore: 2 },
    { value: 'multiple', label: '多选题', defaultScore: 4 },
    { value: 'fill', label: '填空题', defaultScore: 3 },
    { value: 'essay', label: '简答题', defaultScore: 10 }
  ]

  const difficulties = [
    { value: '1', label: '简单' },
    { value: '2', label: '中等' },
    { value: '3', label: '困难' }
  ]

  useEffect(() => {
    fetchExamList()
  }, [])

  const fetchExamList = async () => {
    try {
      setExamListLoading(true)
      const data = await request.get('/exams')
      setExamList(data.list || [])
    } catch (error) {
      console.error('Fetch exams error:', error)
    } finally {
      setExamListLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      
      const typeConfig = {}
      questionTypes.forEach(type => {
        const count = values[`${type.value}Count`] || 0
        const score = values[`${type.value}Score`] || 0
        if (count > 0) {
          typeConfig[type.value] = { count, score }
        }
      })

      if (Object.keys(typeConfig).length === 0) {
        message.error('请至少配置一种题型')
        return
      }

      setLoading(true)
      const data = await request.post('/exams/generate', {
        title: values.title,
        description: values.description,
        totalScore: values.totalScore,
        passScore: values.passScore,
        duration: values.duration,
        knowledgePoint: values.knowledgePoint,
        difficulty: values.difficulty,
        typeConfig
      })

      setExamInfo({
        title: data.title,
        description: data.description,
        totalScore: data.totalScore,
        passScore: data.passScore,
        duration: data.duration
      })
      setGeneratedQuestions(data.questions)
      setPreviewMode(true)
      message.success('题目抽取成功！请预览和调整试卷')
    } catch (error) {
      message.error(error.response?.data?.message || '组卷失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleReplaceQuestion = async (index, question) => {
    try {
      setLoading(true)
      const excludeIds = generatedQuestions.map(q => q.id).join(',')
      
      const data = await request.get('/questions', {
        params: {
          type: question.type,
          knowledgePoint: examInfo.knowledgePoint || '',
          difficulty: question.difficulty,
          pageSize: 100
        }
      })

      const availableQuestions = (data.list || []).filter(q => 
        !generatedQuestions.find(gq => gq.id === q.id)
      )

      if (availableQuestions.length === 0) {
        message.warning('没有可替换的同类型题目了')
        return
      }

      const randomIndex = Math.floor(Math.random() * availableQuestions.length)
      const newQuestion = {
        ...availableQuestions[randomIndex],
        score: question.score,
        sort: question.sort
      }

      const newQuestions = [...generatedQuestions]
      newQuestions[index] = newQuestion
      setGeneratedQuestions(newQuestions)
      message.success('已替换题目')
    } catch (error) {
      message.error('替换失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveQuestion = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= generatedQuestions.length) return
    
    const newQuestions = [...generatedQuestions]
    const tempSort = newQuestions[index].sort
    newQuestions[index].sort = newQuestions[newIndex].sort
    newQuestions[newIndex].sort = tempSort
    
    ;[newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]
    setGeneratedQuestions(newQuestions)
  }

  const handleDeleteQuestion = (index) => {
    const deletedSort = generatedQuestions[index].sort
    const newQuestions = generatedQuestions
      .filter((_, i) => i !== index)
      .map((q, i) => ({
        ...q,
        sort: q.sort > deletedSort ? q.sort - 1 : q.sort
      }))
    setGeneratedQuestions(newQuestions)
    
    const newTotalScore = newQuestions.reduce((sum, q) => sum + q.score, 0)
    setExamInfo({ ...examInfo, totalScore: newTotalScore })
    message.success('已移除该题目')
  }

  const handleSaveExam = async () => {
    try {
      setLoading(true)
      await request.post('/exams', {
        ...examInfo,
        questions: generatedQuestions
      })
      message.success('试卷保存成功！')
      setPreviewMode(false)
      setGeneratedQuestions([])
      setExamInfo(null)
      form.resetFields()
      fetchExamList()
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewExam = async (exam) => {
    try {
      setLoading(true)
      const data = await request.get(`/exams/${exam.id}`)
      setViewingExam(data.exam)
      setViewingExamQuestions(data.questions)
      setViewExamVisible(true)
    } catch (error) {
      message.error('获取试卷详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExam = async (id) => {
    try {
      await request.delete(`/exams/${id}`)
      message.success('删除成功')
      fetchExamList()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    
    const items = Array.from(generatedQuestions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    const reSortedItems = items.map((item, index) => ({
      ...item,
      sort: index + 1
    }))
    
    setGeneratedQuestions(reSortedItems)
  }

  const questionColumns = [
    {
      title: '序号',
      dataIndex: 'sort',
      key: 'sort',
      width: 60
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = { single: '单选题', multiple: '多选题', fill: '填空题', essay: '简答题' }
        const colorMap = { single: 'blue', multiple: 'purple', fill: 'green', essay: 'orange' }
        return <Tag color={colorMap[type]}>{typeMap[type]}</Tag>
      }
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content) => (
        <Tooltip title={content}>
          <span style={{ cursor: 'pointer' }}>{content}</span>
        </Tooltip>
      )
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (d) => {
        const colors = ['', 'success', 'warning', 'error']
        const labels = ['', '简单', '中等', '困难']
        return <Tag color={colors[d]}>{labels[d]}</Tag>
      }
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      width: 70,
      render: (score) => <strong style={{ color: '#1890ff' }}>{score}分</strong>
    }
  ]

  if (previewMode) {
    return (
      <div className="page-container">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1 className="page-title">试卷预览 - {examInfo?.title}</h1>
          <Space>
            <Button onClick={() => setPreviewMode(false)}>
              返回配置
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveExam}
              loading={loading}
            >
              保存试卷
            </Button>
          </Space>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={6}>
              <div>
                <span style={{ color: '#666' }}>总分：</span>
                <strong style={{ fontSize: 18, color: '#1890ff' }}>
                  {generatedQuestions.reduce((sum, q) => sum + q.score, 0)}分
                </strong>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <span style={{ color: '#666' }}>及格分：</span>
                <strong>{examInfo?.passScore}分</strong>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <span style={{ color: '#666' }}>题数：</span>
                <strong>{generatedQuestions.length}题</strong>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <span style={{ color: '#666' }}>时长：</span>
                <strong>{examInfo?.duration}分钟</strong>
              </div>
            </Col>
          </Row>
        </Card>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {generatedQuestions.map((question, index) => (
                  <Draggable
                    key={question.id + '-' + index}
                    draggableId={question.id + '-' + index}
                    index={index}
                  >
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ 
                          marginBottom: 12,
                          ...provided.draggableProps.style
                        }}
                        title={
                          <Space>
                            <Tag color="blue">第 {question.sort} 题</Tag>
                            <Tag color={question.type === 'single' ? 'blue' : question.type === 'multiple' ? 'purple' : question.type === 'fill' ? 'green' : 'orange'}>
                              {question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : question.type === 'fill' ? '填空' : '简答'}
                            </Tag>
                            <Tag>{question.score}分</Tag>
                            <span style={{ fontSize: 12, color: '#999' }}>拖拽调整顺序</span>
                          </Space>
                        }
                        extra={
                          <Space>
                            <Tooltip title="上移">
                              <Button
                                type="text"
                                size="small"
                                icon={<UpOutlined />}
                                onClick={() => handleMoveQuestion(index, -1)}
                                disabled={index === 0}
                              />
                            </Tooltip>
                            <Tooltip title="下移">
                              <Button
                                type="text"
                                size="small"
                                icon={<DownOutlined />}
                                onClick={() => handleMoveQuestion(index, 1)}
                                disabled={index === generatedQuestions.length - 1}
                              />
                            </Tooltip>
                            <Button
                              type="text"
                              size="small"
                              icon={<SwapOutlined />}
                              onClick={() => handleReplaceQuestion(index, question)}
                            >
                              换一题
                            </Button>
                            <Popconfirm
                              title="确定要移除该题目吗？"
                              onConfirm={() => handleDeleteQuestion(index)}
                            >
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        }
                      >
                        <div style={{ 
                          lineHeight: 1.8,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          marginBottom: 12
                        }}>
                          {question.content}
                        </div>
                        
                        {question.options && question.options.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            {question.options.map((option, optIdx) => (
                              <div
                                key={optIdx}
                                style={{
                                  marginBottom: 4,
                                  padding: '4px 8px',
                                  lineHeight: 1.6,
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                <span style={{ fontWeight: 500, marginRight: 4 }}>
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                {option}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ color: '#52c41a', fontSize: 13 }}>
                          <strong>参考答案：</strong>{question.answer}
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          智能组卷
          <Tag color="blue" style={{ marginLeft: 12, fontSize: 12 }}>
            仅从本人题库抽取题目
          </Tag>
        </h1>
      </div>

      <Row gutter={24}>
        <Col span={14}>
          <Card title="组卷配置">
            <Spin spinning={loading}>
              <Form form={form} layout="vertical" initialValues={{
                totalScore: 100,
                passScore: 60,
                duration: 60,
                singleCount: 15,
                singleScore: 2,
                multipleCount: 10,
                multipleScore: 4,
                fillCount: 5,
                fillScore: 3,
                essayCount: 2,
                essayScore: 15
              }}>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="试卷名称"
                      name="title"
                      rules={[{ required: true, message: '请输入试卷名称' }]}
                    >
                      <Input placeholder="如：Vue3 期末考试题" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="试卷描述" name="description">
                      <TextArea rows={2} placeholder="试卷说明..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="总分"
                      name="totalScore"
                      rules={[{ required: true, message: '请输入总分' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="及格分"
                      name="passScore"
                      rules={[{ required: true, message: '请输入及格分' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="考试时长(分钟)"
                      name="duration"
                      rules={[{ required: true, message: '请输入考试时长' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">筛选条件</Divider>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="知识点" name="knowledgePoint">
                      <Input placeholder="可选，如：Vue3、React" allowClear />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="难度级别" name="difficulty">
                      <Select placeholder="不指定则随机抽取" allowClear>
                        {difficulties.map(d => (
                          <Option key={d.value} value={d.value}>{d.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">题型占比（题数 × 分值）</Divider>

                {questionTypes.map(type => (
                  <Row gutter={16} key={type.value}>
                    <Col span={8}>
                      <span style={{ lineHeight: '32px' }}>{type.label}</span>
                    </Col>
                    <Col span={8}>
                      <Form.Item name={`${type.value}Count`}>
                        <InputNumber
                          min={0}
                          max={50}
                          style={{ width: '100%' }}
                          placeholder="题数"
                          addonBefore="题数"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name={`${type.value}Score`}>
                        <InputNumber
                          min={0}
                          max={50}
                          style={{ width: '100%' }}
                          placeholder="每题分值"
                          addonBefore="每题"
                          addonAfter="分"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<FileTextOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                  >
                    智能抽题生成试卷
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="已生成试卷" loading={examListLoading}>
            <Table
              dataSource={examList}
              rowKey="id"
              size="small"
              pagination={false}
              onRow={(record) => ({
                onClick: () => handleViewExam(record)
              })}
            >
              <Table.Column
                title="试卷名称"
                dataIndex="title"
                key="title"
                ellipsis
              />
              <Table.Column
                title="总分"
                dataIndex="totalScore"
                key="totalScore"
                width={70}
                render={(score) => `${score}分`}
              />
              <Table.Column
                title="时长"
                dataIndex="duration"
                key="duration"
                width={70}
                render={(d) => `${d}分钟`}
              />
              <Table.Column
                title="操作"
                key="action"
                width={100}
                render={(_, record) => (
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewExam(record)
                      }}
                    >
                      查看
                    </Button>
                    <Popconfirm
                      title="确定删除该试卷吗？"
                      onConfirm={() => handleDeleteExam(record.id)}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                )}
              />
            </Table>
          </Card>
        </Col>
      </Row>

      <Modal
        title="试卷详情"
        open={viewExamVisible}
        onCancel={() => setViewExamVisible(false)}
        footer={null}
        width={900}
      >
        {viewingExam && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>试卷名：<strong>{viewingExam.title}</strong></Col>
                <Col span={6}>总分：<strong>{viewingExam.totalScore}分</strong></Col>
                <Col span={6}>及格：<strong>{viewingExam.passScore}分</strong></Col>
                <Col span={6}>时长：<strong>{viewingExam.duration}分钟</strong></Col>
              </Row>
            </Card>
            
            {viewingExamQuestions.map((q, idx) => (
              <Card
                key={q.id}
                size="small"
                style={{ marginBottom: 12 }}
                title={
                  <Space>
                    <Tag>第{idx + 1}题</Tag>
                    <Tag>{q.score}分</Tag>
                  </Space>
                }
              >
                <div style={{ lineHeight: 1.6 }}>{q.content}</div>
                {q.options && q.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{ fontSize: 13, marginTop: 4 }}>
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </div>
                ))}
                <div style={{ marginTop: 8, color: '#52c41a', fontSize: 13 }}>
                  答案：{q.answer}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ExamGenerator
