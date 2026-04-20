import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons'
import request from '@/utils/request'

const { Option } = Select

const UserManagement = () => {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchValues, setSearchValues] = useState({
    keyword: '',
    role: ''
  })
  const [filters, setFilters] = useState({
    keyword: '',
    role: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const roles = [
    { value: 'admin', label: '管理员', id: 1 },
    { value: 'teacher', label: '教师', id: 2 },
    { value: 'student', label: '学生', id: 3 }
  ]

  useEffect(() => {
    fetchUsers()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await request.get('/users', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      })
      setUsers(data.list || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFilters({ ...searchValues })
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    setSearchValues({ keyword: '', role: '' })
    setFilters({ keyword: '', role: '' })
    setPagination({ ...pagination, current: 1 })
  }

  const handleAdd = () => {
    setEditingUser(null)
    editForm.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingUser(record)
    editForm.setFieldsValue({
      ...record,
      role: record.role_name
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/users/${id}`)
      message.success('删除成功')
      fetchUsers()
    } catch (error) {
      console.error('Delete user error:', error)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await editForm.validateFields()
      
      const roleInfo = roles.find(r => r.value === values.role)
      const submitData = {
        ...values,
        role_id: roleInfo ? roleInfo.id : 1
      }
      
      if (editingUser) {
        await request.put(`/users/${editingUser.id}`, submitData)
        message.success('更新成功')
      } else {
        await request.post('/users', submitData)
        message.success('添加成功')
      }
      
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      console.error('Save user error:', error)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '角色',
      dataIndex: 'role_name',
      key: 'role',
      width: 100,
      render: (role) => {
        const roleInfo = roles.find(r => r.value === role)
        return roleInfo ? <Tag color="blue">{roleInfo.label}</Tag> : <Tag color="blue">{role}</Tag>
      }
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'createdAt',
      width: 180
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      )
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
            title="确定要删除该用户吗？"
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">用户管理</h1>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索姓名"
              value={searchValues.keyword}
              onChange={(e) => setSearchValues({ ...searchValues, keyword: e.target.value })}
              style={{ width: 200 }}
              allowClear
              onPressEnter={handleSearch}
            />
            <Select
              placeholder="角色"
              value={searchValues.role}
              onChange={(value) => setSearchValues({ ...searchValues, role: value })}
              style={{ width: 120 }}
              allowClear
            >
              {roles.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
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
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
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
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          initialValues={{ role: 'student', status: 1 }}
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { len: 11, message: '请输入11位手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
            ]}
          >
            <Input placeholder="请输入手机号" maxLength={11} />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={editingUser ? [] : [
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder={editingUser ? '留空则不修改密码' : '请输入密码'} />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={1}>正常</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
