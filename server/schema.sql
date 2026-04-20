-- 创建数据库
CREATE DATABASE IF NOT EXISTS g_design DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE g_design;

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID',
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    description VARCHAR(200) COMMENT '角色描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '权限名称',
    description VARCHAR(200) COMMENT '权限描述',
    resource VARCHAR(50) COMMENT '资源类型',
    action VARCHAR(50) COMMENT '操作类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
    role_id BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
    permission_id BIGINT UNSIGNED NOT NULL COMMENT '权限ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    role_id BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 插入初始角色
INSERT INTO roles (name, description) VALUES
('admin', '管理员'),
('teacher', '教师'),
('student', '学生');

-- 插入初始权限
INSERT INTO permissions (name, description, resource, action) VALUES
('user:manage', '用户管理', 'user', 'manage'),
('question:manage', '题库管理', 'question', 'manage'),
('question:create', '创建题目', 'question', 'create'),
('question:edit', '编辑题目', 'question', 'edit'),
('question:delete', '删除题目', 'question', 'delete'),
('exam:manage', '考试管理', 'exam', 'manage'),
('exam:create', '创建考试', 'exam', 'create'),
('exam:edit', '编辑考试', 'exam', 'edit'),
('exam:delete', '删除考试', 'exam', 'delete'),
('exam:take', '参加考试', 'exam', 'take'),
('ai:generate', 'AI智能出题', 'ai', 'generate'),
('result:view', '查看成绩', 'result', 'view');

-- 为管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 为教师角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
    'question:manage', 'question:create', 'question:edit', 'question:delete',
    'exam:manage', 'exam:create', 'exam:edit', 'exam:delete',
    'ai:generate', 'result:view'
);

-- 为学生角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN ('exam:take', 'result:view');

-- 插入初始用户（密码都是123456的bcrypt加密）
INSERT INTO users (username, password, name, email, role_id) VALUES
('admin', '$2a$10$v91EE6nEEiHPV.UNagi2/.J3QomtvzUHQECXFgQjmEj1mbm.zwhvm', '管理员', 'admin@example.com', 1),
('teacher', '$2a$10$v91EE6nEEiHPV.UNagi2/.J3QomtvzUHQECXFgQjmEj1mbm.zwhvm', '教师', 'teacher@example.com', 2),
('student', '$2a$10$v91EE6nEEiHPV.UNagi2/.J3QomtvzUHQECXFgQjmEj1mbm.zwhvm', '学生', 'student@example.com', 3);

-- 题库表
CREATE TABLE IF NOT EXISTS questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '题目ID',
    content TEXT NOT NULL COMMENT '题目内容',
    type VARCHAR(20) NOT NULL COMMENT '题型：single-单选, multiple-多选, fill-填空, essay-简答',
    options JSON COMMENT '选项（JSON数组，仅选择题使用）',
    answer TEXT NOT NULL COMMENT '正确答案',
    explanation TEXT COMMENT '题目解析',
    knowledge_point VARCHAR(200) COMMENT '知识点',
    difficulty TINYINT UNSIGNED COMMENT '难度等级：1-5',
    created_by BIGINT UNSIGNED COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type),
    INDEX idx_knowledge_point (knowledge_point),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题库表';
