package handlers

import (
	"encoding/json"
	"math/rand"
	"strconv"
	"time"

	"g-design-server/models"
	"g-design-server/utils"

	"github.com/gin-gonic/gin"
)

type GenerateExamRequest struct {
	Title          string            `json:"title" binding:"required"`
	Description    string            `json:"description"`
	TotalScore     int               `json:"totalScore" binding:"required,min=1"`
	PassScore      int               `json:"passScore" binding:"required,min=1"`
	Duration       int               `json:"duration" binding:"required,min=1"`
	KnowledgePoint string            `json:"knowledgePoint"`
	Difficulty     string            `json:"difficulty"`
	TypeConfig     map[string]TypeConfig `json:"typeConfig" binding:"required"`
}

type TypeConfig struct {
	Count int `json:"count" binding:"min=0"`
	Score int `json:"score" binding:"min=0"`
}

type ExamQuestionResponse struct {
	ID             uint     `json:"id"`
	Content        string   `json:"content"`
	Type           string   `json:"type"`
	Options        []string `json:"options,omitempty"`
	Answer         string   `json:"answer"`
	Explanation    string   `json:"explanation"`
	KnowledgePoint string   `json:"knowledgePoint"`
	Difficulty     int      `json:"difficulty"`
	Score          int      `json:"score"`
	Sort           int      `json:"sort"`
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GenerateExam(c *gin.Context) {
	var req GenerateExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("role_name")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	// 验证总分是否匹配
	calcTotalScore := 0
	for _, config := range req.TypeConfig {
		calcTotalScore += config.Count * config.Score
	}
	if calcTotalScore != req.TotalScore {
		utils.BadRequest(c, "题型配置总分与试卷总分不匹配")
		return
	}

	// 按题型随机抽取题目
	var allExamQuestions []ExamQuestionResponse
	sort := 1

	for qType, config := range req.TypeConfig {
		if config.Count <= 0 {
			continue
		}

		var questions []models.Question
		query := models.DB.Model(&models.Question{}).Where("type = ?", qType)
		
		if userRole == "teacher" {
			query = query.Where("created_by = ?", userID)
		}
		if req.KnowledgePoint != "" {
			query = query.Where("knowledge_point LIKE ?", "%"+req.KnowledgePoint+"%")
		}
		if req.Difficulty != "" {
			query = query.Where("difficulty = ?", req.Difficulty)
		}

		// 随机排序抽取
		if err := query.Order("RAND()").Limit(config.Count).Find(&questions).Error; err != nil {
			utils.InternalServerError(c, "抽取题目失败")
			return
		}

		if len(questions) < config.Count {
			utils.BadRequest(c, qType+" 题型题库数量不足，需要 "+strconv.Itoa(config.Count)+" 题，当前仅 "+strconv.Itoa(len(questions))+" 题")
			return
		}

		for _, q := range questions {
			var options []string
			if q.Options != nil && *q.Options != "" {
				json.Unmarshal([]byte(*q.Options), &options)
			}
			allExamQuestions = append(allExamQuestions, ExamQuestionResponse{
				ID:             q.ID,
				Content:        q.Content,
				Type:           q.Type,
				Options:        options,
				Answer:         q.Answer,
				Explanation:    q.Explanation,
				KnowledgePoint: q.KnowledgePoint,
				Difficulty:     q.Difficulty,
				Score:          config.Score,
				Sort:           sort,
			})
			sort++
		}
	}

	utils.Success(c, gin.H{
		"title":       req.Title,
		"description": req.Description,
		"totalScore":  req.TotalScore,
		"passScore":   req.PassScore,
		"duration":    req.Duration,
		"questions":   allExamQuestions,
	})
}

func CreateExam(c *gin.Context) {
	type CreateExamRequest struct {
		Title       string                  `json:"title" binding:"required"`
		Description string                  `json:"description"`
		TotalScore  int                     `json:"totalScore" binding:"required"`
		PassScore   int                     `json:"passScore" binding:"required"`
		Duration    int                     `json:"duration" binding:"required"`
		Questions   []ExamQuestionResponse  `json:"questions" binding:"required,min=1"`
	}

	var req CreateExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	tx := models.DB.Begin()

	exam := models.Exam{
		Title:       req.Title,
		Description: req.Description,
		TotalScore:  req.TotalScore,
		PassScore:   req.PassScore,
		Duration:    req.Duration,
		Status:      1,
		CreatedBy:   userID.(uint),
	}

	if err := tx.Create(&exam).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "创建试卷失败")
		return
	}

	for _, q := range req.Questions {
		examQuestion := models.ExamQuestion{
			ExamID:      exam.ID,
			QuestionID:  q.ID,
			Sort:        q.Sort,
			Score:       q.Score,
		}
		if err := tx.Create(&examQuestion).Error; err != nil {
			tx.Rollback()
			utils.InternalServerError(c, "保存试卷题目失败")
			return
		}
	}

	tx.Commit()

	utils.Success(c, gin.H{
		"id": exam.ID,
		"message": "试卷创建成功",
	})
}

func GetExams(c *gin.Context) {
	var exams []models.Exam
	var total int64

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("role_name")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	keyword := c.Query("keyword")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	query := models.DB.Model(&models.Exam{})

	if userRole == "teacher" {
		query = query.Where("created_by = ?", userID)
	}

	if keyword != "" {
		query = query.Where("title LIKE ?", "%"+keyword+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	if err := query.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&exams).Error; err != nil {
		utils.InternalServerError(c, "查询试卷失败")
		return
	}

	utils.Success(c, gin.H{
		"list":     exams,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func GetExamDetail(c *gin.Context) {
	id := c.Param("id")

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("role_name")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var exam models.Exam
	if err := models.DB.First(&exam, id).Error; err != nil {
		utils.BadRequest(c, "试卷不存在")
		return
	}

	if userRole == "teacher" && exam.CreatedBy != userID.(uint) {
		utils.Forbidden(c, "无权限查看该试卷")
		return
	}

	var examQuestions []models.ExamQuestion
	if err := models.DB.Where("exam_id = ?", id).Order("sort ASC").Find(&examQuestions).Error; err != nil {
		utils.InternalServerError(c, "查询试卷题目失败")
		return
	}

	questionIDs := make([]uint, 0, len(examQuestions))
	questionScoreMap := make(map[uint]int)
	questionSortMap := make(map[uint]int)

	for _, eq := range examQuestions {
		questionIDs = append(questionIDs, eq.QuestionID)
		questionScoreMap[eq.QuestionID] = eq.Score
		questionSortMap[eq.QuestionID] = eq.Sort
	}

	var questions []models.Question
	if err := models.DB.Where("id IN ?", questionIDs).Find(&questions).Error; err != nil {
		utils.InternalServerError(c, "查询题目详情失败")
		return
	}

	var result []ExamQuestionResponse
	for _, q := range questions {
		var options []string
		if q.Options != nil && *q.Options != "" {
			json.Unmarshal([]byte(*q.Options), &options)
		}
		result = append(result, ExamQuestionResponse{
			ID:             q.ID,
			Content:        q.Content,
			Type:           q.Type,
			Options:        options,
			Answer:         q.Answer,
			Explanation:    q.Explanation,
			KnowledgePoint: q.KnowledgePoint,
			Difficulty:     q.Difficulty,
			Score:          questionScoreMap[q.ID],
			Sort:           questionSortMap[q.ID],
		})
	}

	// 按排序号重新排序
	for i := 0; i < len(result); i++ {
		for j := i + 1; j < len(result); j++ {
			if result[i].Sort > result[j].Sort {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	utils.Success(c, gin.H{
		"exam":      exam,
		"questions": result,
	})
}

func DeleteExam(c *gin.Context) {
	id := c.Param("id")

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("role_name")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var exam models.Exam
	if err := models.DB.First(&exam, id).Error; err != nil {
		utils.BadRequest(c, "试卷不存在")
		return
	}

	if userRole == "teacher" && exam.CreatedBy != userID.(uint) {
		utils.Forbidden(c, "无权限删除该试卷")
		return
	}

	tx := models.DB.Begin()

	if err := tx.Where("exam_id = ?", id).Delete(&models.ExamQuestion{}).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "删除试卷题目失败")
		return
	}

	if err := tx.Delete(&models.Exam{}, id).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "删除试卷失败")
		return
	}

	tx.Commit()

	utils.Success(c, gin.H{"message": "删除成功"})
}
