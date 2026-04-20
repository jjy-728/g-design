-- 修复主观题得分和总分
-- 执行此脚本前请先备份数据

-- 1. 更新主观题得分
UPDATE exam_records er
SET subjective_score = (
    SELECT COALESCE(SUM(a.teacher_score), 0)
    FROM answers a
    JOIN exam_questions eq ON a.question_id = eq.question_id
    JOIN questions q ON eq.question_id = q.id
    WHERE a.record_id = er.id AND q.type = 'essay' AND a.is_graded = 1
)
WHERE grading_status = 'completed';

-- 2. 更新客观题得分（如果为空）
UPDATE exam_records er
SET objective_score = (
    SELECT COALESCE(SUM(a.score), 0)
    FROM answers a
    JOIN exam_questions eq ON a.question_id = eq.question_id
    JOIN questions q ON eq.question_id = q.id
    WHERE a.record_id = er.id AND q.type IN ('single', 'multiple', 'fill')
)
WHERE objective_score IS NULL OR objective_score = 0;

-- 3. 更新总分
UPDATE exam_records
SET total_score = COALESCE(objective_score, 0) + COALESCE(subjective_score, 0)
WHERE grading_status = 'completed';

-- 4. 更新是否通过状态
UPDATE exam_records er
JOIN exams e ON er.exam_id = e.id
SET is_passed = (er.total_score >= e.pass_score)
WHERE er.grading_status = 'completed';

-- 查看修复结果
SELECT 
    er.id,
    er.objective_score,
    er.subjective_score,
    er.total_score,
    er.is_passed,
    er.grading_status,
    er.score_released
FROM exam_records er
WHERE er.grading_status = 'completed';
