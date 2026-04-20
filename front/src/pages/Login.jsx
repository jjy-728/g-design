import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, TrophyOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import request from '@/utils/request'
import './Login.css'

const Login = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginData, setLoginData] = useState(null)
  const navigate = useNavigate()
  const { user, login } = useAuth()

  useEffect(() => {
    const savedPhone = localStorage.getItem('saved_phone')
    const savedPassword = localStorage.getItem('saved_password')
    if (savedPhone && savedPassword) {
      form.setFieldsValue({
        phone: savedPhone,
        password: savedPassword
      })
      setRememberMe(true)
    }
  }, [form])

  useEffect(() => {
    if (user && loginData) {
      const userRole = user.role || user.roleName
      const redirectPath = userRole === 'admin' ? '/admin/users' 
        : userRole === 'teacher' ? '/teacher/ai-generate' 
        : '/student/exams'
      
      message.success('登录成功')
      setLoginData(null)
      navigate(redirectPath, { replace: true })
    }
  }, [user, loginData, navigate])

  const onFinish = async (values) => {
    try {
      setLoading(true)
      
      const response = await request.post('/auth/login', {
        phone: values.phone,
        password: values.password
      })

      const { token, user: userData } = response

      if (rememberMe) {
        localStorage.setItem('saved_phone', values.phone)
        localStorage.setItem('saved_password', values.password)
      } else {
        localStorage.removeItem('saved_phone')
        localStorage.removeItem('saved_password')
      }

      setLoginData({ redirect: true })
      login(userData, token)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-background"></div>
      
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">
            <TrophyOutlined className="login-logo-icon" />
          </div>
          <h1>武汉科技大学</h1>
          <p>在线考试管理系统</p>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <div className="feature-icon">
              <SafetyCertificateOutlined />
            </div>
            <h3>安全可靠</h3>
            <p>数据加密保护</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <TrophyOutlined />
            </div>
            <h3>智能评测</h3>
            <p>自动评分系统</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <TeamOutlined />
            </div>
            <h3>高效管理</h3>
            <p>班级权限控制</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>欢迎回来</h2>
            <p>请登录您的账户以继续</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { len: 11, message: '请输入11位手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="手机号"
                maxLength={11}
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

            <div className="login-options">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                  记住密码
                </Checkbox>
              </Form.Item>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                block
                className="login-button"
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <p>© 2026 武汉科技大学 在线考试系统</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
