import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Upload,
  Tag
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import request from '@/utils/request'

const { TextArea } = Input
const { Option } = Select

const QuestionBank = () => {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({
    keyword: '',
    knowledgePoint: '',
    difficulty: '',
    questionType: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const questionTypes = [
    { value: 'single', label: '单选题' },
    { value: 'multiple', label: '多选题' },
    { value: 'fill', label: '填空题' },
    { value: 'essay', label: '简答题' }
  ]

  const difficultyLevels = [
    { value: 1, label: '1级（简单）' },
    { value: 2, label: '2级（较简单）' },
    { value: 3, label: '3级（中等）' },
    { value: 4, label: '4级（较难）' },
    { value: 5, label: '5级（困难）' }
  ]

  useEffect(() => {
    fetchQuestions()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await request.get('/questions', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      })
      setQuestions(response.list || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Fetch questions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    setFilters({
      keyword: '',
      knowledgePoint: '',
      difficulty: '',
      questionType: ''
    })
    setPagination({ ...pagination, current: 1 })
  }

  const handleAdd = () => {
    setEditingQuestion(null)
    editForm.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingQuestion(record)
    // 回显时把选项数组转成换行字符串，并加上 A. B. C. 前缀
    let optionsText = ''
    if (Array.isArray(record.options)) {
      optionsText = record.options
        .filter(o => o.trim())
        .map((option, idx) => {
          const prefix = String.fromCharCode(65 + idx) + '. '
          // 如果已经有前缀就不再重复添加
          if (option.trim().startsWith(prefix)) {
            return option.trim()
          }
          return prefix + option.trim()
        })
        .join('\n')
    }
    const formData = {
      ...record,
      options: optionsText
    }
    editForm.setFieldsValue(formData)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/questions/${id}`)
      message.success('删除成功')
      fetchQuestions()
    } catch (error) {
      console.error('Delete question error:', error)
    }
  }

  const handleBatchDelete = async () => {
    try {
      await request.delete('/questions/batch', { data: { ids: selectedRowKeys } })
      message.success('批量删除成功')
      setSelectedRowKeys([])
      fetchQuestions()
    } catch (error) {
      console.error('Batch delete error:', error)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await editForm.validateFields()
      
      // 处理选项：将换行字符串转为数组，选择题必填
      let processedOptions
      if (values.type === 'single' || values.type === 'multiple') {
        if (!values.options || !values.options.trim()) {
          message.error('选择题请填写选项')
          return
        }
        processedOptions = values.options
          .split('\n')
          .filter(o => o.trim())
          .map(o => o.replace(/^[A-Z][.．\s]+/, '').trim())
      } else {
        // 填空题、简答题不需要选项
        processedOptions = undefined
      }

      const questionData = {
        ...values,
        options: processedOptions
      }
      
      if (editingQuestion) {
        await request.put(`/questions/${editingQuestion.id}`, questionData)
        message.success('更新成功')
      } else {
        await request.post('/questions', questionData)
        message.success('添加成功')
      }
      
      setModalVisible(false)
      fetchQuestions()
    } catch (error) {
      console.error('Save question error:', error)
    }
  }

  const handleExport = async () => {
    try {
      const response = await request.get('/questions/export', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', '题目导出.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      message.success('导出成功')
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const handleImport = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      await request.post('/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      message.success('导入成功')
      fetchQuestions()
    } catch (error) {
      console.error('Import error:', error)
    }
    
    return false
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 350
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeInfo = questionTypes.find(t => t.value === type)
        return typeInfo ? <Tag color="blue">{typeInfo.label}</Tag> : type
      }
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoint',
      key: 'knowledgePoint',
      width: 150
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty) => {
        const colors = ['green', 'cyan', 'blue', 'orange', 'red']
        return <Tag color={colors[difficulty - 1]}>{difficulty}级</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这道题目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title">
          题库管理
          <Tag color="blue" style={{ marginLeft: 12, fontSize: 12 }}>
            仅显示本人创建的题目
          </Tag>
        </h1>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索题目内容"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              style={{ width: 200 }}
              allowClear
            />
            <Input
              placeholder="知识点"
              value={filters.knowledgePoint}
              onChange={(e) => setFilters({ ...filters, knowledgePoint: e.target.value })}
              style={{ width: 150 }}
              allowClear
            />
            <Select
              placeholder="难度"
              value={filters.difficulty}
              onChange={(value) => setFilters({ ...filters, difficulty: value })}
              style={{ width: 120 }}
              allowClear
            >
              {difficultyLevels.map(level => (
                <Option key={level.value} value={level.value}>
                  {level.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="题型"
              value={filters.questionType}
              onChange={(value) => setFilters({ ...filters, questionType: value })}
              style={{ width: 120 }}
              allowClear
            >
              {questionTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增题目
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 道题目吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                >
                  批量删除
                </Button>
              </Popconfirm>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadOutlined />}>
                导入
              </Button>
            </Upload>
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={questions}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender: (record) => {
              if (record.type === 'single' || record.type === 'multiple') {
                return (
                  <div style={{ padding: '16px', background: '#fafafa', borderRadius: 4 }}>
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ color: '#1890ff', display: 'inline-block', marginBottom: 4 }}>题目详情：</strong>
                      <div style={{ lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {record.content}
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ display: 'inline-block', marginBottom: 8 }}>选项：</strong>
                      <div>
                        {Array.isArray(record.options) && record.options.map((option, idx) => (
                          <div key={idx} style={{ 
                            marginBottom: 8, 
                            padding: '8px 12px',
                            borderRadius: 4,
                            lineHeight: 1.6,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            background: record.answer.toUpperCase().includes(String.fromCharCode(65 + idx)) 
                              ? '#f6ffed' 
                              : '#fff',
                            border: record.answer.toUpperCase().includes(String.fromCharCode(65 + idx)) 
                              ? '1px solid #b7eb8f' 
                              : '1px solid #e8e8e8'
                          }}>
                            <span style={{ 
                              fontWeight: 600, 
                              color: record.answer.toUpperCase().includes(String.fromCharCode(65 + idx)) 
                                ? '#52c41a' 
                                : '#333',
                              marginRight: 4
                            }}>
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Tag color="success" style={{ marginBottom: 8 }}>正确答案：{record.answer}</Tag>
                      {record.explanation && (
                        <div style={{ 
                          marginTop: 8, 
                          color: '#666', 
                          lineHeight: 1.6, 
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          <strong>解析：</strong>{record.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              return (
                <div style={{ padding: '16px', background: '#fafafa', borderRadius: 4 }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ color: '#1890ff', display: 'inline-block', marginBottom: 4 }}>题目详情：</strong>
                    <div style={{ lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {record.content}
                    </div>
                  </div>
                  <div>
                    <Tag color="success" style={{ marginBottom: 8 }}>正确答案：{record.answer}</Tag>
                    {record.explanation && (
                      <div style={{ 
                        marginTop: 8, 
                        color: '#666', 
                        lineHeight: 1.6, 
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        <strong>解析：</strong>{record.explanation}
                      </div>
                    )}
                  </div>
                </div>
              )
            }
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize })
            }
          }}
        />
      </Card>

      <Modal
        title={editingQuestion ? '编辑题目' : '新增题目'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          initialValues={{
            difficulty: 3,
            type: 'single'
          }}
        >
          <Form.Item
            label="题目内容"
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={4} placeholder="请输入题目内容" />
          </Form.Item>

          <Form.Item
            label="题型"
            name="type"
            rules={[{ required: true, message: '请选择题型' }]}
          >
            <Select placeholder="请选择题型">
              {questionTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="知识点"
            name="knowledgePoint"
            rules={[{ required: true, message: '请输入知识点' }]}
          >
            <Input placeholder="请输入知识点" />
          </Form.Item>

          <Form.Item
            label="难度"
            name="difficulty"
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <Select placeholder="请选择难度">
              {difficultyLevels.map(level => (
                <Option key={level.value} value={level.value}>
                  {level.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="选项（每行一个，选择题必填，字母前缀自动添加）"
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
            <Input placeholder="请输入参考答案" />
          </Form.Item>

          <Form.Item
            label="解析"
            name="explanation"
          >
            <TextArea rows={3} placeholder="请输入题目解析（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuestionBank
