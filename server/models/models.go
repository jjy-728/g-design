package models

import (
	"time"

	_ "gorm.io/gorm"
)

type Role struct {
	ID          uint         `gorm:"primarykey" json:"id"`
	Name        string       `gorm:"type:varchar(50);uniqueIndex;not null" json:"name"`
	Description string       `gorm:"type:varchar(200)" json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions,omitempty"`
	Users       []User       `gorm:"foreignKey:RoleID" json:"users,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type Permission struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	Name        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description string    `gorm:"type:varchar(200)" json:"description"`
	Resource    string    `gorm:"type:varchar(50)" json:"resource"`
	Action      string    `gorm:"type:varchar(50)" json:"action"`
	Roles       []Role    `gorm:"many2many:role_permissions;" json:"roles,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Class struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`
	Grade       string    `gorm:"type:varchar(50)" json:"grade"`
	Description string    `gorm:"type:varchar(200)" json:"description"`
	Teachers    []User    `gorm:"many2many:teacher_classes;foreignKey:ID;joinForeignKey:ClassID;References:ID;joinReferences:TeacherID" json:"teachers,omitempty"`
	Students    []User    `gorm:"foreignKey:ClassID" json:"students,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type TeacherClass struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	TeacherID uint      `gorm:"not null;index" json:"teacherId"`
	ClassID   uint      `gorm:"not null;index" json:"classId"`
	Teacher   User      `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Class     Class     `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type User struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Username  string    `gorm:"type:varchar(50);not null;uniqueIndex" json:"username"`
	Password  string    `gorm:"type:varchar(255); not null" json:"-"`
	Name      string    `gorm:"type:varchar(50);not null" json:"name"`
	Phone     string    `gorm:"type:varchar(20)" json:"phone"`
	Email     string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"email"`
	RoleID    uint      `gorm:"column:role_id;not null;index" json:"roleId"`
	Role      Role      `gorm:"foreignKey:RoleID" json:"role"`
	ClassID   *uint     `gorm:"index" json:"classId"`
	Class     *Class    `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Status    int       `gorm:"type:int;default:1;index" json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RolePermission struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	RoleID       uint       `gorm:"not null;index" json:"role_id"`
	PermissionID uint       `gorm:"not null;index" json:"permission_id"`
	Role         Role       `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Permission   Permission `gorm:"foreignKey:PermissionID" json:"permission,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Question struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	Type           string    `gorm:"type:varchar(20);not null;index" json:"type"`
	Options        *string   `gorm:"type:json" json:"options"`
	Answer         string    `gorm:"type:text;not null" json:"answer"`
	Explanation    string    `gorm:"type:text" json:"explanation"`
	KnowledgePoint string    `gorm:"column:knowledge_point;type:varchar(200);index" json:"knowledgePoint"`
	Difficulty     int       `gorm:"type:int;index" json:"difficulty"`
	CreatedBy      uint      `gorm:"column:created_by;index" json:"createdBy"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type Exam struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	Title       string    `gorm:"type:varchar(200);not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	TotalScore  int       `gorm:"type:int;not null;default:100" json:"totalScore"`
	PassScore   int       `gorm:"type:int;not null;default:60" json:"passScore"`
	Duration    int       `gorm:"type:int;not null;default:60" json:"duration"`
	Status      int       `gorm:"type:int;default:1;index" json:"status"`
	ClassID     *uint     `gorm:"index" json:"classId"`
	Class       *Class    `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	CreatedBy   uint      `gorm:"index" json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ExamQuestion struct {
	ID         uint `gorm:"primarykey" json:"id"`
	ExamID     uint `gorm:"not null;index" json:"examId"`
	QuestionID uint `gorm:"not null;index" json:"questionId"`
	Sort       int  `gorm:"type:int;default:0" json:"sort"`
	Score      int  `gorm:"type:int;not null" json:"score"`
}

type ExamRecord struct {
	ID              uint       `gorm:"primarykey" json:"id"`
	ExamID          uint       `gorm:"not null;index" json:"examId"`
	StudentID       uint       `gorm:"not null;index" json:"studentId"`
	Status          string     `gorm:"type:varchar(20);not null;default:'not_started'" json:"status"`
	StartTime       *time.Time `json:"startTime"`
	SubmitTime      *time.Time `json:"submitTime"`
	TimeUsed        int        `gorm:"type:int;default:0" json:"timeUsed"`
	TotalScore      *float64   `json:"totalScore"`
	ObjectiveScore  *float64   `json:"objectiveScore"`
	SubjectiveScore *float64   `json:"subjectiveScore"`
	IsPassed        *bool      `json:"isPassed"`
	GradingStatus   string     `gorm:"type:varchar(20);default:'pending'" json:"gradingStatus"`
	ScoreReleased   bool       `gorm:"default:false" json:"scoreReleased"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type Answer struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	RecordID       uint      `gorm:"not null;index" json:"recordId"`
	QuestionID     uint      `gorm:"not null;index" json:"questionId"`
	StudentAnswer  string    `gorm:"type:text" json:"studentAnswer"`
	IsCorrect      *bool     `json:"isCorrect"`
	Score          *float64  `json:"score"`
	IsMarked       bool      `gorm:"default:false" json:"isMarked"`
	TeacherScore   *float64  `json:"teacherScore"`
	TeacherComment *string   `gorm:"type:text" json:"teacherComment"`
	IsGraded       bool      `gorm:"default:false" json:"isGraded"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
