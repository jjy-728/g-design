package handlers

import (
	"g-design-server/models"
	"g-design-server/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetClasses(c *gin.Context) {
	var classes []models.Class
	if err := models.DB.Find(&classes).Error; err != nil {
		utils.InternalServerError(c, "获取班级列表失败")
		return
	}

	type ClassWithCount struct {
		ID           uint          `json:"id"`
		Name         string        `json:"name"`
		Grade        string        `json:"grade"`
		Description  string        `json:"description"`
		Teachers     []models.User `json:"teachers"`
		Students     []models.User `json:"students"`
		TeacherCount int           `json:"teacherCount"`
		StudentCount int           `json:"studentCount"`
		CreatedAt    time.Time     `json:"createdAt"`
		UpdatedAt    time.Time     `json:"updatedAt"`
	}

	result := make([]ClassWithCount, 0, len(classes))
	for _, class := range classes {
		var teachers []models.User
		var students []models.User

		var teacherClasses []models.TeacherClass
		models.DB.Where("class_id = ?", class.ID).Find(&teacherClasses)

		teacherIDs := make([]uint, 0)
		for _, tc := range teacherClasses {
			teacherIDs = append(teacherIDs, tc.TeacherID)
		}

		if len(teacherIDs) > 0 {
			models.DB.Where("id IN ?", teacherIDs).Find(&teachers)
		}

		models.DB.Where("class_id = ?", class.ID).Find(&students)

		result = append(result, ClassWithCount{
			ID:           class.ID,
			Name:         class.Name,
			Grade:        class.Grade,
			Description:  class.Description,
			Teachers:     teachers,
			Students:     students,
			TeacherCount: len(teachers),
			StudentCount: len(students),
			CreatedAt:    class.CreatedAt,
			UpdatedAt:    class.UpdatedAt,
		})
	}

	utils.Success(c, result)
}

func GetClass(c *gin.Context) {
	id := c.Param("id")
	var class models.Class
	if err := models.DB.Preload("Teachers").Preload("Students").First(&class, id).Error; err != nil {
		utils.BadRequest(c, "班级不存在")
		return
	}

	utils.Success(c, class)
}

func CreateClass(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Grade       string `json:"grade"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	class := models.Class{
		Name:        req.Name,
		Grade:       req.Grade,
		Description: req.Description,
	}

	if err := models.DB.Create(&class).Error; err != nil {
		utils.InternalServerError(c, "创建班级失败")
		return
	}

	utils.Success(c, class)
}

func UpdateClass(c *gin.Context) {
	id := c.Param("id")
	var class models.Class
	if err := models.DB.First(&class, id).Error; err != nil {
		utils.BadRequest(c, "班级不存在")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Grade       string `json:"grade"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if req.Name != "" {
		class.Name = req.Name
	}
	if req.Grade != "" {
		class.Grade = req.Grade
	}
	if req.Description != "" {
		class.Description = req.Description
	}

	if err := models.DB.Save(&class).Error; err != nil {
		utils.InternalServerError(c, "更新班级失败")
		return
	}

	utils.Success(c, class)
}

func DeleteClass(c *gin.Context) {
	id := c.Param("id")
	var class models.Class
	if err := models.DB.First(&class, id).Error; err != nil {
		utils.BadRequest(c, "班级不存在")
		return
	}

	tx := models.DB.Begin()

	if err := tx.Where("class_id = ?", id).Delete(&models.TeacherClass{}).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "删除班级关联教师失败")
		return
	}

	if err := tx.Model(&models.User{}).Where("class_id = ?", id).Update("class_id", nil).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "删除班级关联学生失败")
		return
	}

	if err := tx.Delete(&class).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "删除班级失败")
		return
	}

	tx.Commit()
	utils.Success(c, gin.H{"message": "删除成功"})
}

func AssignTeacherToClass(c *gin.Context) {
	var req struct {
		TeacherID uint `json:"teacherId" binding:"required"`
		ClassID   uint `json:"classId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	var teacher models.User
	if err := models.DB.First(&teacher, req.TeacherID).Error; err != nil {
		utils.BadRequest(c, "教师不存在")
		return
	}

	var class models.Class
	if err := models.DB.First(&class, req.ClassID).Error; err != nil {
		utils.BadRequest(c, "班级不存在")
		return
	}

	teacherClass := models.TeacherClass{
		TeacherID: req.TeacherID,
		ClassID:   req.ClassID,
	}

	if err := models.DB.Create(&teacherClass).Error; err != nil {
		utils.InternalServerError(c, "分配失败")
		return
	}

	utils.Success(c, gin.H{"message": "分配成功"})
}

func RemoveTeacherFromClass(c *gin.Context) {
	teacherID := c.Query("teacherId")
	classID := c.Query("classId")

	if teacherID == "" || classID == "" {
		utils.BadRequest(c, "参数错误")
		return
	}

	tid, _ := strconv.ParseUint(teacherID, 10, 32)
	cid, _ := strconv.ParseUint(classID, 10, 32)

	if err := models.DB.Where("teacher_id = ? AND class_id = ?", tid, cid).Delete(&models.TeacherClass{}).Error; err != nil {
		utils.InternalServerError(c, "移除失败")
		return
	}

	utils.Success(c, gin.H{"message": "移除成功"})
}

func GetTeacherClasses(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var teacherClasses []models.TeacherClass
	if err := models.DB.Where("teacher_id = ?", userID).Preload("Class").Find(&teacherClasses).Error; err != nil {
		utils.InternalServerError(c, "获取班级列表失败")
		return
	}

	classes := make([]models.Class, 0)
	for _, tc := range teacherClasses {
		classes = append(classes, tc.Class)
	}

	utils.Success(c, classes)
}

func GetClassStudents(c *gin.Context) {
	classID := c.Param("id")

	var students []models.User
	if err := models.DB.Where("class_id = ?", classID).Find(&students).Error; err != nil {
		utils.InternalServerError(c, "获取学生列表失败")
		return
	}

	utils.Success(c, students)
}

func AssignStudentToClass(c *gin.Context) {
	var req struct {
		StudentID uint `json:"studentId" binding:"required"`
		ClassID   uint `json:"classId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	var student models.User
	if err := models.DB.First(&student, req.StudentID).Error; err != nil {
		utils.BadRequest(c, "学生不存在")
		return
	}

	var class models.Class
	if err := models.DB.First(&class, req.ClassID).Error; err != nil {
		utils.BadRequest(c, "班级不存在")
		return
	}

	student.ClassID = &req.ClassID
	if err := models.DB.Save(&student).Error; err != nil {
		utils.InternalServerError(c, "分配失败")
		return
	}

	utils.Success(c, gin.H{"message": "分配成功"})
}
