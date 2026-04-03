export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
}

export const PERMISSIONS = {
  USER_MANAGE: 'user:manage',
  QUESTION_MANAGE: 'question:manage',
  QUESTION_CREATE: 'question:create',
  QUESTION_EDIT: 'question:edit',
  QUESTION_DELETE: 'question:delete',
  EXAM_MANAGE: 'exam:manage',
  EXAM_CREATE: 'exam:create',
  EXAM_EDIT: 'exam:edit',
  EXAM_DELETE: 'exam:delete',
  EXAM_TAKE: 'exam:take',
  AI_GENERATE: 'ai:generate',
  RESULT_VIEW: 'result:view'
}

export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  FILL: 'fill',
  ESSAY: 'essay'
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE]: '单选题',
  [QUESTION_TYPES.MULTIPLE]: '多选题',
  [QUESTION_TYPES.FILL]: '填空题',
  [QUESTION_TYPES.ESSAY]: '简答题'
}

export const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM_EASY: 2,
  MEDIUM: 3,
  MEDIUM_HARD: 4,
  HARD: 5
}

export const DIFFICULTY_LABELS = {
  1: '1级（简单）',
  2: '2级（较简单）',
  3: '3级（中等）',
  4: '4级（较难）',
  5: '5级（困难）'
}

export const EXAM_STATUS = {
  AVAILABLE: 'available',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  UPCOMING: 'upcoming'
}

export const EXAM_STATUS_LABELS = {
  [EXAM_STATUS.AVAILABLE]: '可参加',
  [EXAM_STATUS.COMPLETED]: '已完成',
  [EXAM_STATUS.EXPIRED]: '已过期',
  [EXAM_STATUS.UPCOMING]: '未开始'
}
