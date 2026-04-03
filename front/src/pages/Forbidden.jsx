import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

const Forbidden = () => {
  const navigate = useNavigate()

  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问该页面"
      extra={
        <Button type="primary" onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      }
    />
  )
}

export default Forbidden
