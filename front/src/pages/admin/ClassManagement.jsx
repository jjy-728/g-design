import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm, Empty, Avatar } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons'
import request from '@/utils/request'
import './ClassManagement.css'

const { Option } = Select

const ClassManagement = () => {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [studentModalVisible, setStudentModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [form] = Form.useForm()
  const [assignForm] = Form.useForm()
  const [studentForm] = Form.useForm()

  useEffect(() => {
    fetchClasses()
    fetchTeachers()
    fetchStudents()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await request.get('/classes')
      setClasses(response || [])
    } catch (error) {
      console.error('Fetch classes error:', error)
      message.error('加载班级列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await request.get('/users', {
        params: { roleId: 2 }
      })
      setTeachers(response.list || [])
    } catch (error) {
      console.error('Fetch teachers error:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await request.get('/users', {
        params: { roleId: 3 }
      })
      setStudents(response.list || [])
    } catch (error) {
      console.error('Fetch students error:', error)
    }
  }

  const handleCreate = () => {
    setEditingClass(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingClass(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/classes/${id}`)
      message.success('删除成功')
      fetchClasses()
    } catch (error) {
      console.error('Delete class error:', error)
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingClass) {
        await request.put(`/classes/${editingClass.id}`, values)
        message.success('更新成功')
      } else {
        await request.post('/classes', values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchClasses()
    } catch (error) {
      console.error('Submit error:', error)
      message.error('操作失败')
    }
  }

  const handleAssignTeacher = (record) => {
    setSelectedClass(record)
    assignForm.resetFields()
    setAssignModalVisible(true)
  }

  const handleAssignTeacherSubmit = async () => {
    try {
      const values = await assignForm.validateFields()
      await request.post('/classes/assign-teacher', {
        teacherId: values.teacherId,
        classId: selectedClass.id
      })
      message.success('分配成功')
      setAssignModalVisible(false)
      fetchClasses()
    } catch (error) {
      console.error('Assign teacher error:', error)
      message.error('分配失败')
    }
  }

  const handleAssignStudent = (record) => {
    setSelectedClass(record)
    studentForm.resetFields()
    setStudentModalVisible(true)
  }

  const handleAssignStudentSubmit = async () => {
    try {
      const values = await studentForm.validateFields()
      await request.post('/classes/assign-student', {
        studentId: values.studentId,
        classId: selectedClass.id
      })
      message.success('分配成功')
      setStudentModalVisible(false)
      fetchClasses()
    } catch (error) {
      console.error('Assign student error:', error)
      message.error('分配失败')
    }
  }

  const handleViewDetail = (record) => {
    setSelectedClass(record)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => grade || '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '教师数量',
      dataIndex: 'teacherCount',
      key: 'teacherCount',
      width: 100,
      align: 'center',
      render: (count) => <Tag color={count > 0 ? 'green' : 'default'}>{count || 0}</Tag>
    },
    {
      title: '学生数量',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 100,
      align: 'center',
      render: (count) => <Tag color={count > 0 ? 'orange' : 'default'}>{count || 0}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleAssignTeacher(record)}
          >
            分配教师
          </Button>
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => handleAssignStudent(record)}
          >
            分配学生
          </Button>
          <Popconfirm
            title="确定要删除这个班级吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
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

  return (
    <div className="class-management-container">
      <div className="page-header">
        <h1 className="page-title">
          <TeamOutlined /> 班级管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新建班级
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个班级`
          }}
        />
      </Card>

      <Modal
        title={editingClass ? '编辑班级' : '新建班级'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="请输入班级名称" />
          </Form.Item>
          <Form.Item
            name="grade"
            label="年级"
          >
            <Input placeholder="请输入年级" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入班级描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分配教师 - ${selectedClass?.name}`}
        open={assignModalVisible}
        onOk={handleAssignTeacherSubmit}
        onCancel={() => setAssignModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="teacherId"
            label="选择教师"
            rules={[{ required: true, message: '请选择教师' }]}
          >
            <Select 
              placeholder="请选择教师"
              notFoundContent={
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                  所有教师已分配到此班级
                </div>
              }
            >
              {teachers
                .filter(teacher => {
                  if (!selectedClass?.teachers) return true
                  return !selectedClass.teachers.some(t => t.id === teacher.id)
                })
                .map(teacher => (
                  <Option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分配学生 - ${selectedClass?.name}`}
        open={studentModalVisible}
        onOk={handleAssignStudentSubmit}
        onCancel={() => setStudentModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={studentForm} layout="vertical">
          <Form.Item
            name="studentId"
            label="选择学生"
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Select 
              placeholder="请选择学生"
              notFoundContent={
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                  所有学生已分配到班级
                </div>
              }
            >
              {students
                .filter(student => !student.classId)
                .map(student => (
                  <Option key={student.id} value={student.id}>
                    {student.name}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`班级详情 - ${selectedClass?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: '#262626' }}>
            <TeamOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            教师列表 ({selectedClass?.teachers?.length || 0}人)
          </h4>
          {selectedClass?.teachers && selectedClass.teachers.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedClass.teachers.map(teacher => (
                <Tag 
                  key={teacher.id} 
                  color="green" 
                  style={{ padding: '4px 12px', fontSize: '14px' }}
                >
                  <Avatar size="small" style={{ marginRight: 6, backgroundColor: '#52c41a' }}>
                    {teacher.name?.charAt(0)}
                  </Avatar>
                  {teacher.name}
                  <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: '12px' }}>
                    {teacher.email || teacher.phone}
                  </span>
                </Tag>
              ))}
            </div>
          ) : (
            <Empty description="暂无教师" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>

        <div>
          <h4 style={{ marginBottom: 12, color: '#262626' }}>
            <UserOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
            学生列表 ({selectedClass?.students?.length || 0}人)
          </h4>
          {selectedClass?.students && selectedClass.students.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {selectedClass.students.map(student => (
                <Tag 
                  key={student.id} 
                  color="orange" 
                  style={{ padding: '4px 12px', fontSize: '14px' }}
                >
                  <Avatar size="small" style={{ marginRight: 6, backgroundColor: '#fa8c16' }}>
                    {student.name?.charAt(0)}
                  </Avatar>
                  {student.name}
                  <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: '12px' }}>
                    {student.email || student.phone}
                  </span>
                </Tag>
              ))}
            </div>
          ) : (
            <Empty description="暂无学生" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ClassManagement
