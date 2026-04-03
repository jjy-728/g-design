import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import request from '@/utils/request'

const Login = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const savedUsername = localStorage.getItem('saved_username')
    const savedPassword = localStorage.getItem('saved_password')
    if (savedUsername && savedPassword) {
      form.setFieldsValue({
        username: savedUsername,
        password: savedPassword
      })
      setRememberMe(true)
    }
  }, [form])

  const onFinish = async (values) => {
    try {
      setLoading(true)
      
      const response = await request.post('/auth/login', {
        username: values.username,
        password: values.password
      })

      const { token, user } = response

      if (rememberMe) {
        localStorage.setItem('saved_username', values.username)
        localStorage.setItem('saved_password', values.password)
      } else {
        localStorage.removeItem('saved_username')
        localStorage.removeItem('saved_password')
      }

      login(user, token)
      message.success('登录成功')
      
      const redirectPath = user.role === 'admin' ? '/admin/users' 
        : user.role === 'teacher' ? '/teacher/ai-generate' 
        : '/student/exams'
      
      navigate(redirectPath, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">G-Design 在线考试系统</h1>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                记住密码
              </Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
