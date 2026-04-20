-- ============================================================
-- 在线考试系统数据库初始化脚本
-- 数据库: g_design
-- 字符集: utf8mb4
-- 数据库引擎: InnoDB
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS g_design 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE g_design;

-- ============================================================
-- 1. 角色表 (roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `description` varchar(200) DEFAULT NULL COMMENT '角色描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_roles_name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ============================================================
-- 2. 权限表 (permissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `name` varchar(100) NOT NULL COMMENT '权限名称',
  `description` varchar(200) DEFAULT NULL COMMENT '权限描述',
  `resource` varchar(50) DEFAULT NULL COMMENT '资源类型',
  `action` varchar(50) DEFAULT NULL COMMENT '操作类型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_permissions_name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_resource` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ============================================================
-- 3. 角色权限关联表 (role_permissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `role_id` bigint unsigned NOT NULL COMMENT '角色ID',
  `permission_id` bigint unsigned NOT NULL COMMENT '权限ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ============================================================
-- 4. 班级表 (classes)
-- ============================================================
CREATE TABLE IF NOT EXISTS `classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `name` varchar(100) NOT NULL COMMENT '班级名称',
  `grade` varchar(50) DEFAULT NULL COMMENT '年级',
  `description` varchar(200) DEFAULT NULL COMMENT '班级描述',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_classes_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- ============================================================
-- 5. 用户表 (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `name` varchar(50) NOT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `role_id` bigint unsigned NOT NULL COMMENT '角色ID',
  `class_id` bigint unsigned DEFAULT NULL COMMENT '班级ID（学生专用）',
  `status` tinyint DEFAULT '1' COMMENT '状态：1-启用，0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_users_class_id` (`class_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_users_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 6. 教师班级关联表 (teacher_classes)
-- ============================================================
CREATE TABLE IF NOT EXISTS `teacher_classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `teacher_id` bigint unsigned NOT NULL COMMENT '教师ID',
  `class_id` bigint unsigned NOT NULL COMMENT '班级ID',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_teacher_class_unique` (`teacher_id`,`class_id`),
  KEY `idx_teacher_classes_teacher_id` (`teacher_id`),
  KEY `idx_teacher_classes_class_id` (`class_id`),
  CONSTRAINT `fk_teacher_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teacher_classes_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师班级关联表';

-- ============================================================
-- 7. 题库表 (questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS `questions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '题目ID',
  `content` text NOT NULL COMMENT '题目内容',
  `type` varchar(20) NOT NULL COMMENT '题型：single-单选, multiple-多选, fill-填空, essay-简答',
  `options` json DEFAULT NULL COMMENT '选项（JSON数组，仅选择题使用）',
  `answer` text NOT NULL COMMENT '正确答案',
  `explanation` text COMMENT '题目解析',
  `knowledge_point` varchar(200) DEFAULT NULL COMMENT '知识点',
  `difficulty` tinyint unsigned DEFAULT NULL COMMENT '难度等级：1-5',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_knowledge_point` (`knowledge_point`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_questions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题库表';

-- ============================================================
-- 8. 试卷表 (exams)
-- ============================================================
CREATE TABLE IF NOT EXISTS `exams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `title` varchar(200) NOT NULL COMMENT '试卷标题',
  `description` text COMMENT '试卷描述',
  `total_score` int NOT NULL DEFAULT '100' COMMENT '总分',
  `pass_score` int NOT NULL DEFAULT '60' COMMENT '及格分数',
  `duration` int NOT NULL DEFAULT '60' COMMENT '考试时长（分钟）',
  `status` int DEFAULT '1' COMMENT '状态：1-启用，0-禁用',
  `class_id` bigint unsigned DEFAULT NULL COMMENT '班级ID',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_exams_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exams_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷表';

-- ============================================================
-- 9. 试卷题目关联表 (exam_questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS `exam_questions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `exam_id` bigint unsigned NOT NULL COMMENT '试卷ID',
  `question_id` bigint unsigned NOT NULL COMMENT '题目ID',
  `sort` int DEFAULT '0' COMMENT '排序序号',
  `score` int NOT NULL COMMENT '题目分值',
  PRIMARY KEY (`id`),
  KEY `idx_exam_questions_exam_id` (`exam_id`),
  KEY `idx_exam_questions_question_id` (`question_id`),
  CONSTRAINT `fk_exam_questions_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exam_questions_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷题目关联表';

-- ============================================================
-- 10. 考试记录表 (exam_records)
-- ============================================================
CREATE TABLE IF NOT EXISTS `exam_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `exam_id` bigint unsigned NOT NULL COMMENT '试卷ID',
  `student_id` bigint unsigned NOT NULL COMMENT '学生ID',
  `status` varchar(20) NOT NULL DEFAULT 'not_started' COMMENT '状态：not_started-未开始, in_progress-进行中, submitted-已提交',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `submit_time` datetime DEFAULT NULL COMMENT '提交时间',
  `time_used` int DEFAULT '0' COMMENT '已用时间（秒）',
  `total_score` double DEFAULT NULL COMMENT '总得分',
  `objective_score` double DEFAULT NULL COMMENT '客观题得分',
  `subjective_score` double DEFAULT NULL COMMENT '主观题得分',
  `is_passed` tinyint(1) DEFAULT NULL COMMENT '是否通过：1-通过，0-未通过',
  `grading_status` varchar(20) DEFAULT 'pending' COMMENT '阅卷状态：pending-待阅卷, partial-部分阅卷, completed-已完成',
  `score_released` tinyint(1) DEFAULT '0' COMMENT '成绩是否发布：1-已发布，0-未发布',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_records_exam_id` (`exam_id`),
  KEY `idx_exam_records_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_grading_status` (`grading_status`),
  CONSTRAINT `fk_exam_records_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exam_records_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表';

-- ============================================================
-- 11. 答题记录表 (answers)
-- ============================================================
CREATE TABLE IF NOT EXISTS `answers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '答案ID',
  `record_id` bigint unsigned NOT NULL COMMENT '考试记录ID',
  `question_id` bigint unsigned NOT NULL COMMENT '题目ID',
  `student_answer` text COMMENT '学生答案',
  `is_correct` tinyint(1) DEFAULT NULL COMMENT '是否正确：1-正确，0-错误',
  `score` double DEFAULT NULL COMMENT '得分',
  `is_marked` tinyint(1) DEFAULT '0' COMMENT '是否标记：1-已标记，0-未标记',
  `teacher_score` double DEFAULT NULL COMMENT '教师评分',
  `teacher_comment` text COMMENT '教师评语',
  `is_graded` tinyint(1) DEFAULT '0' COMMENT '是否已评分：1-已评分，0-未评分',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_answers_record_id` (`record_id`),
  KEY `idx_answers_question_id` (`question_id`),
  KEY `idx_is_marked` (`is_marked`),
  KEY `idx_is_graded` (`is_graded`),
  CONSTRAINT `fk_answers_record` FOREIGN KEY (`record_id`) REFERENCES `exam_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 插入初始角色
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, '管理员', '系统管理员，拥有所有权限'),
(2, '教师', '教师，负责出题、组卷和阅卷'),
(3, '学生', '学生，可以参加考试和查看成绩');

-- 插入初始权限
INSERT INTO `permissions` (`id`, `name`, `description`, `resource`, `action`) VALUES
(1, 'user:manage', '用户管理', 'user', 'manage'),
(2, 'question:manage', '题库管理', 'question', 'manage'),
(3, 'question:create', '创建题目', 'question', 'create'),
(4, 'question:edit', '编辑题目', 'question', 'edit'),
(5, 'question:delete', '删除题目', 'question', 'delete'),
(6, 'exam:manage', '考试管理', 'exam', 'manage'),
(7, 'exam:create', '创建考试', 'exam', 'create'),
(8, 'exam:edit', '编辑考试', 'exam', 'edit'),
(9, 'exam:delete', '删除考试', 'exam', 'delete'),
(10, 'exam:take', '参加考试', 'exam', 'take'),
(11, 'ai:generate', 'AI智能出题', 'ai', 'generate'),
(12, 'result:view', '查看成绩', 'result', 'view');

-- 为管理员角色分配所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM permissions;

-- 为教师角色分配权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM permissions WHERE name IN (
    'question:manage', 'question:create', 'question:edit', 'question:delete',
    'exam:manage', 'exam:create', 'exam:edit', 'exam:delete',
    'ai:generate', 'result:view'
);

-- 为学生角色分配权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, id FROM permissions WHERE name IN ('exam:take', 'result:view');

-- 插入测试班级
INSERT INTO `classes` (`id`, `name`, `grade`, `description`, `created_at`, `updated_at`) VALUES
(1, '计算机科学1班', '2024级', '计算机科学与技术专业1班', NOW(), NOW()),
(2, '计算机科学2班', '2024级', '计算机科学与技术专业2班', NOW(), NOW()),
(3, '软件工程1班', '2024级', '软件工程专业1班', NOW(), NOW());

-- 插入初始用户（密码：123456，bcrypt加密）
INSERT INTO `users` (`id`, `username`, `password`, `name`, `email`, `phone`, `role_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$10$v91EE6nEEiHPV.UNagi2/.J3QomtvzUHQECXFgQjmEj1mbm.zwhvm', '管理员', 'admin@example.com', '13800138001', 1, 1, NOW(), NOW()),
(2, 'teacher', '$2a$10$v91EE6nEEiHPV.UNagi2/.J3QomtvzUHQECXFgQjmEj1mbm.zwhvm', '教师', 'teacher@example.com', '13800138002', 2, 1, NOW(), NOW()),
(3, 'student', '$2a$10$v91EE6nEEiHPV.UNagi2/.J3QomtvzUHQECXFgQjmEj1mbm.zwhvm', '学生', 'student@example.com', '13800138003', 3, 1, NOW(), NOW());
