# G-Design 在线考试系统

基于 React 18 + Ant Design + Vite 构建的现代化在线考试系统，后端采用 Gin + GORM + MySQL。

## 项目结构

```
g_design/
├── front/                 # 前端项目
│   ├── src/
│   │   ├── api/               # API 接口定义
│   │   │   └── index.js
│   │   ├── components/        # 公共组件
│   │   │   ├── AppHeader.jsx
│   │   │   ├── PermissionButton.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/           # Context 状态管理
│   │   │   ├── AppContext.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── constants/         # 常量定义
│   │   │   └── index.js
│   │   ├── layouts/           # 布局组件
│   │   │   └── MainLayout.jsx
│   │   ├── pages/             # 页面组件
│   │   │   ├── admin/         # 管理员页面
│   │   │   │   └── UserManagement.jsx
│   │   │   ├── student/       # 学生页面
│   │   │   │   ├── ExamHistory.jsx
│   │   │   │   ├── ExamList.jsx
│   │   │   │   └── TakeExam.jsx
│   │   │   ├── teacher/       # 教师页面
│   │   │   │   ├── AIQuestionGenerator.jsx
│   │   │   │   └── QuestionBank.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Forbidden.jsx
│   │   │   ├── Login.jsx
│   │   │   └── NotFound.jsx
│   │   ├── routes/            # 路由配置
│   │   │   └── index.jsx
│   │   ├── utils/             # 工具函数
│   │   │   ├── auth.js
│   │   │   ├── helpers.js
│   │   │   └── request.js
│   │   ├── App.jsx            # 根组件
│   │   ├── index.css          # 全局样式
│   │   └── main.jsx           # 应用入口
│   ├── .eslintrc.cjs          # ESLint 配置
│   ├── .gitignore             # Git 忽略文件
│   ├── index.html             # HTML 模板
│   ├── package.json           # 项目依赖
│   ├── tsconfig.json          # TypeScript 配置
│   ├── tsconfig.node.json     # Node TypeScript 配置
│   └── vite.config.js         # Vite 配置
├── server/                # 后端项目
│   ├── config/              # 配置文件
│   │   └── config.go
│   ├── models/              # 数据模型
│   │   ├── models.go
│   │   └── db.go
│   ├── middleware/          # 中间件
│   │   ├── auth.go
│   │   └── rbac.go
│   ├── handlers/            # 处理器
│   │   ├── auth.go
│   │   └── user.go
│   ├── routes/              # 路由
│   │   └── router.go
│   ├── utils/               # 工具函数
│   │   ├── jwt.go
│   │   ├── password.go
│   │   └── response.go
│   ├── config.yaml          # 配置文件
│   ├── schema.sql           # 数据库建表语句
│   ├── go.mod              # Go 模块文件
│   └── main.go             # 主程序入口
└── README.md
```

## 功能特性

### 核心功能
- ✅ 用户认证与授权（JWT Token）
- ✅ RBAC 权限控制（管理员/教师/学生）
- ✅ 动态路由和菜单渲染
- ✅ 请求/响应拦截器
- ✅ 全局状态管理（Context API）

### 管理员功能
- ✅ 用户管理（增删改查）
- ✅ 系统数据统计

### 教师功能
- ✅ AI 智能出题（对接后端 AI 接口）
- ✅ 题库管理（增删改查、批量导入导出）
- ✅ 题目多条件查询（知识点/难度/题型）
- ✅ 试卷发布管理

### 学生功能
- ✅ 在线考试（支持单选/多选/填空/简答）
- ✅ 考试倒计时
- ✅ 疑难题目标记
- ✅ 答案自动保存
- ✅ 客观题即时得分
- ✅ 考试记录查看

## 技术栈

### 前端
- **框架**: React 18
- **UI 组件库**: Ant Design 5
- **路由**: React Router 6
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **状态管理**: React Context API
- **日期处理**: Day.js

### 后端
- **框架**: Gin
- **ORM**: GORM
- **数据库**: MySQL
- **认证**: JWT (golang-jwt/jwt/v5)
- **密码加密**: bcrypt

## 快速开始

### 数据库初始化

1. 创建数据库并导入初始数据：
```bash
mysql -u root -p < server/schema.sql
```

2. 修改数据库配置文件 `server/config.yaml`：
```yaml
database:
  host: localhost
  port: 3306
  username: root
  password: your_password
  dbname: g_design
  charset: utf8mb4
```

### 后端安装依赖

```bash
cd server
go mod download
```

### 启动后端服务

```bash
cd server
go run main.go
```

后端服务将运行在 http://localhost:8080

### 前端安装依赖

```bash
cd front
npm install
```

### 启动前端开发服务器

```bash
cd front
npm run dev
```

前端服务将运行在 http://localhost:3000

### 构建生产版本

```bash
cd front
npm run build
```

### 预览生产构建

```bash
cd front
npm run preview
```

## 环境配置

### 后端配置

在 `server/config.yaml` 中配置：

```yaml
server:
  port: 8080
  mode: debug

database:
  host: localhost
  port: 3306
  username: root
  password: root
  dbname: g_design
  charset: utf8mb4

jwt:
  secret: g-design-secret-key-2024
  expire: 24h
```

### 前端配置

在 `front/vite.config.js` 中配置后端 API 代理：

```javascript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

## 登录说明

### 测试账号

**管理员账号**
- 用户名: admin
- 密码: admin123

**教师账号**
- 用户名: teacher
- 密码: teacher123

**学生账号**
- 用户名: student
- 密码: student123

## 权限说明

### 管理员 (admin)
- 用户管理
- 系统数据查看

### 教师 (teacher)
- AI 智能出题
- 题库管理
- 试卷发布

### 学生 (student)
- 在线考试
- 考试记录查看

## API 接口说明

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/user/current` - 获取当前用户信息
- `POST /api/user/logout` - 用户登出

### 用户接口
- `GET /api/users` - 获取用户列表（需要 user:manage 权限）
- `POST /api/users` - 创建用户（需要 user:manage 权限）
- `PUT /api/users/:id` - 更新用户（需要 user:manage 权限）
- `DELETE /api/users/:id` - 删除用户（需要 user:manage 权限）

### 题目接口
- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `PUT /api/questions/:id` - 更新题目
- `DELETE /api/questions/:id` - 删除题目
- `DELETE /api/questions/batch` - 批量删除题目
- `GET /api/questions/export` - 导出题目
- `POST /api/questions/import` - 导入题目

### AI 接口
- `POST /api/ai/generate-questions` - AI 生成题目

### 考试接口
- `GET /api/exams` - 获取考试列表
- `GET /api/exams/:id` - 获取考试详情
- `GET /api/exams/history` - 获取考试历史
- `POST /api/exams/:id/submit` - 提交试卷
- `POST /api/exams/:id/save` - 保存答题进度

## 核心功能实现

### 1. JWT Token 认证

Token 存储在 localStorage 中，每次请求自动携带在 Authorization header：

```javascript
Authorization: Bearer {token}
```

### 2. RBAC 权限控制

基于角色的访问控制，支持页面级和按钮级权限控制：

```javascript
<PrivateRoute requiredRole="teacher">
  <TeacherPage />
</PrivateRoute>

<PermissionButton permission="question:delete">
  删除
</PermissionButton>
```

后端权限中间件：

```go
r.Use(middleware.AuthMiddleware(), middleware.RequirePermission("user:manage"))
```

### 3. 请求拦截器

自动添加 Token，处理 401 未授权：

```javascript
service.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

### 4. 响应拦截器

统一处理错误响应，自动跳转登录页：

```javascript
service.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      logout()
      navigate('/login')
    }
    return Promise.reject(error)
  }
)
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 注意事项

1. 确保后端 API 服务已启动并运行在配置的端口
2. 登录后 Token 会自动存储在 localStorage
3. 答案会每 5 秒自动保存
4. 考试时间结束后会自动交卷
5. Mock 模式默认关闭，在 `front/src/utils/request.js` 中设置 `MOCK_MODE = true` 可启用 Mock 模式

## License

MIT
