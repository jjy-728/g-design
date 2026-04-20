package handlers

import (
	"encoding/json"
	"fmt"
	"time"

	"g-design-server/models"
	"g-design-server/redis"
	"g-design-server/utils"

	"github.com/gin-gonic/gin"
)

const (
	DashboardCacheExpiration = 5 * time.Minute
)

func GetDashboardStats(c *gin.Context) {
	userID, _ := c.Get("user_id")
	roleName, _ := c.Get("role_name")

	cacheKey := fmt.Sprintf("dashboard:stats:%s:%d", roleName, userID)

	cached, err := redis.Get(cacheKey)
	if err == nil && cached != "" {
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(cached), &result); err == nil {
			utils.Success(c, result)
			return
		}
	}

	var stats map[string]interface{}
	switch roleName {
	case "admin":
		stats = getAdminStatsData()
	case "teacher":
		stats = getTeacherStatsData(userID.(uint))
	case "student":
		stats = getStudentStatsData(userID.(uint))
	default:
		utils.BadRequest(c, "未知角色")
		return
	}

	if data, err := json.Marshal(stats); err == nil {
		redis.Set(cacheKey, string(data), DashboardCacheExpiration)
	}

	utils.Success(c, stats)
}

func getAdminStats(c *gin.Context) {
	stats := getAdminStatsData()
	utils.Success(c, stats)
}

func getAdminStatsData() map[string]interface{} {
	var userCount int64
	var adminCount int64
	var teacherCount int64
	var studentCount int64
	var examCount int64

	models.DB.Model(&models.User{}).Count(&userCount)

	models.DB.Table("users").
		Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", "admin").
		Count(&adminCount)

	models.DB.Table("users").
		Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", "teacher").
		Count(&teacherCount)

	models.DB.Table("users").
		Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", "student").
		Count(&studentCount)

	models.DB.Model(&models.Exam{}).Where("status = ?", 1).Count(&examCount)

	return gin.H{
		"userCount":    userCount,
		"adminCount":   adminCount,
		"teacherCount": teacherCount,
		"studentCount": studentCount,
		"examCount":    examCount,
	}
}

func getTeacherStats(c *gin.Context, teacherID uint) {
	stats := getTeacherStatsData(teacherID)
	utils.Success(c, stats)
}

func getTeacherStatsData(teacherID uint) map[string]interface{} {
	var questionCount int64
	var examCount int64
	var pendingGradingCount int64
	var studentCount int64

	models.DB.Model(&models.Question{}).Where("created_by = ?", teacherID).Count(&questionCount)
	models.DB.Model(&models.Exam{}).Where("created_by = ? AND status = ?", teacherID, 1).Count(&examCount)

	var teacherClasses []models.TeacherClass
	models.DB.Where("teacher_id = ?", teacherID).Find(&teacherClasses)

	classIDs := make([]uint, 0)
	for _, tc := range teacherClasses {
		classIDs = append(classIDs, tc.ClassID)
	}

	if len(classIDs) > 0 {
		models.DB.Model(&models.User{}).Where("class_id IN ?", classIDs).Count(&studentCount)

		var examIDs []uint
		models.DB.Model(&models.Exam{}).Where("class_id IN ? AND status = ?", classIDs, 1).Pluck("id", &examIDs)

		if len(examIDs) > 0 {
			models.DB.Model(&models.ExamRecord{}).
				Where("exam_id IN ? AND grading_status = ?", examIDs, "pending").
				Count(&pendingGradingCount)
		}
	}

	return gin.H{
		"questionCount":       questionCount,
		"examCount":           examCount,
		"pendingGradingCount": pendingGradingCount,
		"studentCount":        studentCount,
	}
}

func getStudentStats(c *gin.Context, studentID uint) {
	stats := getStudentStatsData(studentID)
	utils.Success(c, stats)
}

func getStudentStatsData(studentID uint) map[string]interface{} {
	var completedExamCount int64
	var pendingExamCount int64
	var totalScore float64
	var examCountWithScore int64

	models.DB.Model(&models.ExamRecord{}).
		Where("student_id = ? AND status = ?", studentID, "submitted").
		Count(&completedExamCount)

	var records []models.ExamRecord
	models.DB.Where("student_id = ? AND status = ? AND score_released = ?", studentID, "submitted", true).
		Find(&records)

	for _, record := range records {
		if record.TotalScore != nil {
			totalScore += *record.TotalScore
			examCountWithScore++
		}
	}

	var avgScore float64 = 0
	if examCountWithScore > 0 {
		avgScore = totalScore / float64(examCountWithScore)
	}

	var allExams []models.Exam
	models.DB.Where("status = ?", 1).Find(&allExams)

	var submittedExamIDs []uint
	models.DB.Model(&models.ExamRecord{}).
		Where("student_id = ? AND status = ?", studentID, "submitted").
		Pluck("exam_id", &submittedExamIDs)

	submittedMap := make(map[uint]bool)
	for _, id := range submittedExamIDs {
		submittedMap[id] = true
	}

	for _, exam := range allExams {
		if !submittedMap[exam.ID] {
			pendingExamCount++
		}
	}

	return gin.H{
		"completedExamCount": completedExamCount,
		"avgScore":           avgScore,
		"pendingExamCount":   pendingExamCount,
	}
}

func ClearDashboardCache(userID uint, roleName string) {
	cacheKey := fmt.Sprintf("dashboard:stats:%s:%d", roleName, userID)
	redis.Del(cacheKey)
}
