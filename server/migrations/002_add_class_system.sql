-- 班级管理系统数据库迁移脚本
-- 执行前请备份数据库

-- 1. 创建班级表
CREATE TABLE IF NOT EXISTS `classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '班级名称',
  `grade` varchar(50) DEFAULT NULL COMMENT '年级',
  `description` varchar(200) DEFAULT NULL COMMENT '班级描述',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_classes_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- 2. 创建教师-班级关联表
CREATE TABLE IF NOT EXISTS `teacher_classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint unsigned NOT NULL COMMENT '教师ID',
  `class_id` bigint unsigned NOT NULL COMMENT '班级ID',
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_teacher_classes_teacher_id` (`teacher_id`),
  KEY `idx_teacher_classes_class_id` (`class_id`),
  UNIQUE KEY `idx_teacher_class_unique` (`teacher_id`, `class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师班级关联表';

-- 3. 为用户表添加班级字段
ALTER TABLE `users` ADD COLUMN `class_id` bigint unsigned DEFAULT NULL COMMENT '班级ID（学生专用）';
ALTER TABLE `users` ADD INDEX `idx_users_class_id` (`class_id`);
ALTER TABLE `users` ADD CONSTRAINT `fk_users_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL;

-- 4. 为试卷表添加班级字段
ALTER TABLE `exams` ADD COLUMN `class_id` bigint unsigned DEFAULT NULL COMMENT '班级ID';
ALTER TABLE `exams` ADD INDEX `idx_exams_class_id` (`class_id`);
ALTER TABLE `exams` ADD CONSTRAINT `fk_exams_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL;

-- 5. 为教师班级关联表添加外键约束
ALTER TABLE `teacher_classes` ADD CONSTRAINT `fk_teacher_classes_teacher` 
  FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `teacher_classes` ADD CONSTRAINT `fk_teacher_classes_class` 
  FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE;

-- 6. 插入测试班级数据
INSERT INTO `classes` (`name`, `grade`, `description`, `created_at`, `updated_at`) VALUES
('计算机科学1班', '2024级', '计算机科学与技术专业1班', NOW(), NOW()),
('计算机科学2班', '2024级', '计算机科学与技术专业2班', NOW(), NOW()),
('软件工程1班', '2024级', '软件工程专业1班', NOW(), NOW());

-- 回滚脚本（如需回滚，请执行以下语句）
-- ALTER TABLE `users` DROP FOREIGN KEY `fk_users_class`;
-- ALTER TABLE `users` DROP COLUMN `class_id`;
-- ALTER TABLE `exams` DROP FOREIGN KEY `fk_exams_class`;
-- ALTER TABLE `exams` DROP COLUMN `class_id`;
-- DROP TABLE IF EXISTS `teacher_classes`;
-- DROP TABLE IF EXISTS `classes`;
