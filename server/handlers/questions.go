package handlers

import (
	"encoding/json"
	"strconv"

	"g-design-server/models"
	"g-design-server/utils"

	"github.com/gin-gonic/gin"
)

type CreateQuestionRequest struct {
	Content        string   `json:"content" binding:"required"`
	Type           string   `json:"type" binding:"required,oneof=single multiple fill essay"`
	Options        []string `json:"options"`
	Answer         string   `json:"answer" binding:"required"`
	Explanation    string   `json:"explanation"`
	KnowledgePoint string   `json:"knowledgePoint" binding:"required"`
	Difficulty     int      `json:"difficulty" binding:"required,min=1,max=5"`
}

type CreateQuestionsBatchRequest struct {
	Questions []CreateQuestionRequest `json:"questions" binding:"required,min=1"`
}

func CreateQuestion(c *gin.Context) {
	var req CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var optionsStr *string
	if len(req.Options) > 0 {
		optionsJSON, err := json.Marshal(req.Options)
		if err != nil {
			utils.InternalServerError(c, "选项序列化失败")
			return
		}
		jsonStr := string(optionsJSON)
		optionsStr = &jsonStr
	}

	question := models.Question{
		Content:        req.Content,
		Type:           req.Type,
		Options:        optionsStr,
		Answer:         req.Answer,
		Explanation:    req.Explanation,
		KnowledgePoint: req.KnowledgePoint,
		Difficulty:     req.Difficulty,
		CreatedBy:      userID.(uint),
	}

	if err := models.DB.Create(&question).Error; err != nil {
		utils.InternalServerError(c, "保存题目失败")
		return
	}

	utils.Success(c, question)
}

func CreateQuestionsBatch(c *gin.Context) {
	var req CreateQuestionsBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var questions []models.Question
	for _, q := range req.Questions {
		var optionsStr *string
		if len(q.Options) > 0 {
			optionsJSON, err := json.Marshal(q.Options)
			if err != nil {
				utils.InternalServerError(c, "选项序列化失败")
				return
			}
			jsonStr := string(optionsJSON)
			optionsStr = &jsonStr
		}

		question := models.Question{
			Content:        q.Content,
			Type:           q.Type,
			Options:        optionsStr,
			Answer:         q.Answer,
			Explanation:    q.Explanation,
			KnowledgePoint: q.KnowledgePoint,
			Difficulty:     q.Difficulty,
			CreatedBy:      userID.(uint),
		}
		questions = append(questions, question)
	}

	tx := models.DB.Begin()
	for i := range questions {
		if err := tx.Create(&questions[i]).Error; err != nil {
			tx.Rollback()
			utils.InternalServerError(c, "批量保存题目失败")
			return
		}
	}
	tx.Commit()

	utils.Success(c, gin.H{
		"count":     len(questions),
		"questions": questions,
	})
}

func GetQuestions(c *gin.Context) {
	var questions []models.Question
	var total int64

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("role_name")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	keyword := c.Query("keyword")
	questionType := c.Query("questionType")
	knowledgePoint := c.Query("knowledgePoint")
	difficulty := c.Query("difficulty")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	query := models.DB.Model(&models.Question{})

	if userRole == "teacher" {
		query = query.Where("created_by = ?", userID)
	}

	if keyword != "" {
		query = query.Where("content LIKE ?", "%"+keyword+"%")
	}
	if questionType != "" {
		query = query.Where("type = ?", questionType)
	}
	if knowledgePoint != "" {
		query = query.Where("knowledge_point LIKE ?", "%"+knowledgePoint+"%")
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}

	query.Count(&total)

	if err := query.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&questions).Error; err != nil {
		utils.InternalServerError(c, "查询题目失败")
		return
	}

	type QuestionResponse struct {
		ID             uint      `json:"id"`
		Content        string    `json:"content"`
		Type           string    `json:"type"`
		Options        []string  `json:"options,omitempty"`
		Answer         string    `json:"answer"`
		Explanation    string    `json:"explanation"`
		KnowledgePoint string    `json:"knowledgePoint"`
		Difficulty     int       `json:"difficulty"`
		CreatedBy      uint      `json:"createdBy"`
		CreatedAt      string    `json:"createdAt"`
	}

	var result []QuestionResponse
	for _, q := range questions {
		var options []string
		if q.Options != nil && *q.Options != "" {
			json.Unmarshal([]byte(*q.Options), &options)
		}
		result = append(result, QuestionResponse{
			ID:             q.ID,
			Content:        q.Content,
			Type:           q.Type,
			Options:        options,
			Answer:         q.Answer,
			Explanation:    q.Explanation,
			KnowledgePoint: q.KnowledgePoint,
			Difficulty:     q.Difficulty,
			CreatedBy:      q.CreatedBy,
			CreatedAt:      q.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	utils.Success(c, gin.H{
		"list":     result,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func UpdateQuestion(c *gin.Context) {
	id := c.Param("id")

	var req CreateQuestionRequest
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

	var question models.Question
	if err := models.DB.First(&question, id).Error; err != nil {
		utils.BadRequest(c, "题目不存在")
		return
	}

	if userRole != "admin" && question.CreatedBy != userID.(uint) {
		utils.Forbidden(c, "无权限修改该题目")
		return
	}

	var optionsStr *string
	if len(req.Options) > 0 {
		optionsJSON, err := json.Marshal(req.Options)
		if err != nil {
			utils.InternalServerError(c, "选项序列化失败")
			return
		}
		jsonStr := string(optionsJSON)
		optionsStr = &jsonStr
	}

	question.Content = req.Content
	question.Type = req.Type
	question.Options = optionsStr
	question.Answer = req.Answer
	question.Explanation = req.Explanation
	question.KnowledgePoint = req.KnowledgePoint
	question.Difficulty = req.Difficulty

	if err := models.DB.Save(&question).Error; err != nil {
		utils.InternalServerError(c, "更新题目失败")
		return
	}

	utils.Success(c, question)
}

func DeleteQuestion(c *gin.Context) {
	id := c.Param("id")

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("role_name")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var question models.Question
	if err := models.DB.First(&question, id).Error; err != nil {
		utils.BadRequest(c, "题目不存在")
		return
	}

	if userRole != "admin" && question.CreatedBy != userID.(uint) {
		utils.Forbidden(c, "无权限删除该题目")
		return
	}

	if err := models.DB.Delete(&models.Question{}, id).Error; err != nil {
		utils.InternalServerError(c, "删除题目失败")
		return
	}

	utils.Success(c, gin.H{"message": "删除成功"})
}

type DeleteQuestionsBatchRequest struct {
	Ids []uint `json:"ids" binding:"required,min=1"`
}

func DeleteQuestionsBatch(c *gin.Context) {
	var req DeleteQuestionsBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	if userRole != "admin" {
		var count int64
		models.DB.Model(&models.Question{}).Where("id IN ? AND created_by != ?", req.Ids, userID.(uint)).Count(&count)
		if count > 0 {
			utils.Forbidden(c, "包含无权限删除的题目")
			return
		}
	}

	if err := models.DB.Delete(&models.Question{}, req.Ids).Error; err != nil {
		utils.InternalServerError(c, "批量删除题目失败")
		return
	}

	utils.Success(c, gin.H{
		"message": "删除成功",
		"count":   len(req.Ids),
	})
}
