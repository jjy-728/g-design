package handlers

import (
	"fmt"
	"strconv"
	"time"

	"g-design-server/models"
	"g-design-server/utils"

	"github.com/gin-gonic/gin"
)

type StartExamRequest struct {
	ExamID uint `json:"examId" binding:"required"`
}

type SubmitAnswerRequest struct {
	RecordID      uint   `json:"recordId" binding:"required"`
	QuestionID    uint   `json:"questionId" binding:"required"`
	StudentAnswer string `json:"studentAnswer"`
}

type SubmitExamRequest struct {
	RecordID uint `json:"recordId" binding:"required"`
}

func GetAvailableExams(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var exams []models.Exam
	if err := models.DB.Where("status = ?", 1).Find(&exams).Error; err != nil {
		utils.InternalServerError(c, "获取考试列表失败")
		return
	}

	var records []models.ExamRecord
	models.DB.Where("student_id = ?", userID).Find(&records)

	recordMap := make(map[uint]models.ExamRecord)
	for _, record := range records {
		recordMap[record.ExamID] = record
	}

	type ExamResponse struct {
		ID          uint               `json:"id"`
		Title       string             `json:"title"`
		Description string             `json:"description"`
		TotalScore  int                `json:"totalScore"`
		PassScore   int                `json:"passScore"`
		Duration    int                `json:"duration"`
		Status      int                `json:"status"`
		Record      *models.ExamRecord `json:"record,omitempty"`
	}

	result := make([]ExamResponse, 0, len(exams))
	for _, exam := range exams {
		item := ExamResponse{
			ID:          exam.ID,
			Title:       exam.Title,
			Description: exam.Description,
			TotalScore:  exam.TotalScore,
			PassScore:   exam.PassScore,
			Duration:    exam.Duration,
			Status:      exam.Status,
		}
		if record, exists := recordMap[exam.ID]; exists {
			item.Record = &record
		}
		result = append(result, item)
	}

	utils.Success(c, result)
}

func GetExamInfo(c *gin.Context) {
	examID := c.Param("id")
	userID, _ := c.Get("user_id")

	var exam models.Exam
	if err := models.DB.First(&exam, examID).Error; err != nil {
		utils.BadRequest(c, "考试不存在")
		return
	}

	if exam.Status != 1 {
		utils.BadRequest(c, "该考试未发布")
		return
	}

	var record models.ExamRecord
	err := models.DB.Where("exam_id = ? AND student_id = ?", examID, userID).First(&record).Error

	response := gin.H{
		"exam":   exam,
		"record": nil,
	}

	if err == nil {
		response["record"] = record
	}

	utils.Success(c, response)
}

func StartExam(c *gin.Context) {
	var req StartExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	var existingRecord models.ExamRecord
	err := models.DB.Where("exam_id = ? AND student_id = ?", req.ExamID, userID).First(&existingRecord).Error
	if err == nil {
		if existingRecord.Status == "submitted" {
			utils.BadRequest(c, "考试已提交，不能重复参加")
			return
		}
		utils.Success(c, existingRecord)
		return
	}

	var exam models.Exam
	if err := models.DB.First(&exam, req.ExamID).Error; err != nil {
		utils.BadRequest(c, "考试不存在")
		return
	}

	now := time.Now()
	record := models.ExamRecord{
		ExamID:    req.ExamID,
		StudentID: userID.(uint),
		Status:    "in_progress",
		StartTime: &now,
	}

	if err := models.DB.Create(&record).Error; err != nil {
		utils.InternalServerError(c, "开始考试失败")
		return
	}

	utils.Success(c, record)
}

func GetExamQuestions(c *gin.Context) {
	recordID := c.Param("recordId")
	userID, _ := c.Get("user_id")

	var record models.ExamRecord
	if err := models.DB.First(&record, recordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	if record.StudentID != userID.(uint) {
		utils.Forbidden(c, "无权访问此考试")
		return
	}

	if record.Status == "submitted" {
		utils.BadRequest(c, "考试已提交")
		return
	}

	var examQuestions []models.ExamQuestion
	if err := models.DB.Where("exam_id = ?", record.ExamID).Order("sort").Find(&examQuestions).Error; err != nil {
		utils.InternalServerError(c, "获取题目失败")
		return
	}

	var answers []models.Answer
	models.DB.Where("record_id = ?", recordID).Find(&answers)

	answerMap := make(map[uint]models.Answer)
	for _, ans := range answers {
		answerMap[ans.QuestionID] = ans
	}

	type QuestionWithAnswer struct {
		QuestionID    uint    `json:"questionId"`
		Sort          int     `json:"sort"`
		Score         int     `json:"score"`
		Content       string  `json:"content"`
		Type          string  `json:"type"`
		Options       *string `json:"options"`
		StudentAnswer string  `json:"studentAnswer,omitempty"`
		IsMarked      bool    `json:"isMarked"`
	}

	result := make([]QuestionWithAnswer, 0, len(examQuestions))
	for _, eq := range examQuestions {
		var question models.Question
		models.DB.First(&question, eq.QuestionID)

		item := QuestionWithAnswer{
			QuestionID: eq.QuestionID,
			Sort:       eq.Sort,
			Score:      eq.Score,
			Content:    question.Content,
			Type:       question.Type,
			Options:    question.Options,
		}

		if ans, exists := answerMap[eq.QuestionID]; exists {
			item.StudentAnswer = ans.StudentAnswer
			item.IsMarked = ans.IsMarked
		}

		result = append(result, item)
	}

	utils.Success(c, gin.H{
		"record":    record,
		"questions": result,
	})
}

func SaveAnswer(c *gin.Context) {
	var req SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	var record models.ExamRecord
	if err := models.DB.First(&record, req.RecordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	if record.StudentID != userID.(uint) {
		utils.Forbidden(c, "无权操作")
		return
	}

	if record.Status == "submitted" {
		utils.BadRequest(c, "考试已提交")
		return
	}

	var answer models.Answer
	err := models.DB.Where("record_id = ? AND question_id = ?", req.RecordID, req.QuestionID).First(&answer).Error

	if err != nil {
		answer = models.Answer{
			RecordID:      req.RecordID,
			QuestionID:    req.QuestionID,
			StudentAnswer: req.StudentAnswer,
		}
		if err := models.DB.Create(&answer).Error; err != nil {
			utils.InternalServerError(c, "保存答案失败")
			return
		}
	} else {
		answer.StudentAnswer = req.StudentAnswer
		if err := models.DB.Save(&answer).Error; err != nil {
			utils.InternalServerError(c, "更新答案失败")
			return
		}
	}

	utils.Success(c, answer)
}

func ToggleMark(c *gin.Context) {
	var req struct {
		RecordID   uint `json:"recordId" binding:"required"`
		QuestionID uint `json:"questionId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	var record models.ExamRecord
	if err := models.DB.First(&record, req.RecordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	if record.StudentID != userID.(uint) {
		utils.Forbidden(c, "无权操作")
		return
	}

	var answer models.Answer
	err := models.DB.Where("record_id = ? AND question_id = ?", req.RecordID, req.QuestionID).First(&answer).Error

	if err != nil {
		answer = models.Answer{
			RecordID:   req.RecordID,
			QuestionID: req.QuestionID,
			IsMarked:   true,
		}
		models.DB.Create(&answer)
	} else {
		answer.IsMarked = !answer.IsMarked
		models.DB.Save(&answer)
	}

	utils.Success(c, gin.H{"isMarked": answer.IsMarked})
}

func SubmitExam(c *gin.Context) {
	var req SubmitExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	var record models.ExamRecord
	if err := models.DB.First(&record, req.RecordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	if record.StudentID != userID.(uint) {
		utils.Forbidden(c, "无权操作")
		return
	}

	if record.Status == "submitted" {
		utils.BadRequest(c, "考试已提交")
		return
	}

	now := time.Now()
	record.SubmitTime = &now
	record.Status = "submitted"

	if record.StartTime != nil {
		record.TimeUsed = int(now.Sub(*record.StartTime).Seconds())
	}

	models.DB.Save(&record)

	go gradeExam(record.ID)

	utils.Success(c, record)
}

func gradeExam(recordID uint) {
	var record models.ExamRecord
	models.DB.First(&record, recordID)

	var exam models.Exam
	models.DB.First(&exam, record.ExamID)

	var examQuestions []models.ExamQuestion
	models.DB.Where("exam_id = ?", record.ExamID).Find(&examQuestions)

	var answers []models.Answer
	models.DB.Where("record_id = ?", recordID).Find(&answers)

	answerMap := make(map[uint]models.Answer)
	for _, ans := range answers {
		answerMap[ans.QuestionID] = ans
	}

	var objectiveScore float64 = 0
	var subjectiveCount int = 0
	var gradedCount int = 0

	for _, eq := range examQuestions {
		var question models.Question
		models.DB.First(&question, eq.QuestionID)

		answer, exists := answerMap[eq.QuestionID]
		if !exists {
			answer = models.Answer{
				RecordID:   recordID,
				QuestionID: eq.QuestionID,
			}
			models.DB.Create(&answer)
		}

		if question.Type == "single" || question.Type == "multiple" || question.Type == "fill" {
			score := float64(0)
			isCorrect := false

			if answer.StudentAnswer != "" && answer.StudentAnswer == question.Answer {
				score = float64(eq.Score)
				isCorrect = true
			}

			answer.Score = &score
			answer.IsCorrect = &isCorrect
			answer.IsGraded = true
			models.DB.Save(&answer)

			objectiveScore += score
		} else if question.Type == "essay" {
			subjectiveCount++
			answer.IsGraded = false
			models.DB.Save(&answer)
		}
	}

	record.ObjectiveScore = &objectiveScore

	if subjectiveCount == 0 {
		totalScore := objectiveScore
		isPassed := totalScore >= float64(exam.PassScore)
		record.TotalScore = &totalScore
		record.IsPassed = &isPassed
		record.GradingStatus = "completed"
	} else {
		record.GradingStatus = "pending"
	}

	models.DB.Save(&record)

	if subjectiveCount > 0 && gradedCount == subjectiveCount {
		calculateFinalScore(recordID)
	}
}

func calculateFinalScore(recordID uint) {
	var record models.ExamRecord
	models.DB.First(&record, recordID)

	var exam models.Exam
	models.DB.First(&exam, record.ExamID)

	var examQuestions []models.ExamQuestion
	models.DB.Where("exam_id = ?", record.ExamID).Find(&examQuestions)

	questionIDs := make([]uint, 0)
	for _, eq := range examQuestions {
		questionIDs = append(questionIDs, eq.QuestionID)
	}

	var questions []models.Question
	models.DB.Where("id IN ?", questionIDs).Find(&questions)

	questionTypeMap := make(map[uint]string)
	for _, q := range questions {
		questionTypeMap[q.ID] = q.Type
	}

	var answers []models.Answer
	models.DB.Where("record_id = ?", recordID).Find(&answers)

	var objectiveScore float64 = 0
	var subjectiveScore float64 = 0
	for _, ans := range answers {
		questionType := questionTypeMap[ans.QuestionID]
		if questionType == "essay" {
			if ans.TeacherScore != nil {
				subjectiveScore += *ans.TeacherScore
			}
		} else {
			if ans.Score != nil {
				objectiveScore += *ans.Score
			}
		}
	}

	totalScore := objectiveScore + subjectiveScore
	isPassed := totalScore >= float64(exam.PassScore)
	record.TotalScore = &totalScore
	record.ObjectiveScore = &objectiveScore
	record.SubjectiveScore = &subjectiveScore
	record.IsPassed = &isPassed
	record.GradingStatus = "completed"
	models.DB.Save(&record)
}

func GetExamResult(c *gin.Context) {
	recordID := c.Param("recordId")
	userID, _ := c.Get("user_id")

	var record models.ExamRecord
	if err := models.DB.First(&record, recordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	if record.StudentID != userID.(uint) {
		utils.Forbidden(c, "无权访问")
		return
	}

	var exam models.Exam
	models.DB.First(&exam, record.ExamID)

	if !record.ScoreReleased {
		utils.Success(c, gin.H{
			"exam":          exam,
			"record":        record,
			"questions":     []interface{}{},
			"scoreReleased": false,
			"gradingStatus": record.GradingStatus,
			"message":       "成绩尚未发布，请等待教师评阅完成",
		})
		return
	}

	var examQuestions []models.ExamQuestion
	models.DB.Where("exam_id = ?", record.ExamID).Order("sort").Find(&examQuestions)

	var answers []models.Answer
	models.DB.Where("record_id = ?", recordID).Find(&answers)

	answerMap := make(map[uint]models.Answer)
	for _, ans := range answers {
		answerMap[ans.QuestionID] = ans
	}

	type QuestionResult struct {
		QuestionID     uint     `json:"questionId"`
		Content        string   `json:"content"`
		Type           string   `json:"type"`
		Options        *string  `json:"options"`
		StudentAnswer  string   `json:"studentAnswer"`
		CorrectAnswer  string   `json:"correctAnswer"`
		IsCorrect      *bool    `json:"isCorrect"`
		Score          *float64 `json:"score"`
		TeacherScore   *float64 `json:"teacherScore"`
		MaxScore       int      `json:"maxScore"`
		Explanation    string   `json:"explanation"`
		TeacherComment *string  `json:"teacherComment"`
	}

	questions := make([]QuestionResult, 0, len(examQuestions))
	for _, eq := range examQuestions {
		var question models.Question
		models.DB.First(&question, eq.QuestionID)

		item := QuestionResult{
			QuestionID:    eq.QuestionID,
			Content:       question.Content,
			Type:          question.Type,
			Options:       question.Options,
			CorrectAnswer: question.Answer,
			MaxScore:      eq.Score,
			Explanation:   question.Explanation,
		}

		if ans, exists := answerMap[eq.QuestionID]; exists {
			item.StudentAnswer = ans.StudentAnswer
			item.IsCorrect = ans.IsCorrect
			item.Score = ans.Score
			item.TeacherScore = ans.TeacherScore
			item.TeacherComment = ans.TeacherComment
		}

		questions = append(questions, item)
	}

	utils.Success(c, gin.H{
		"exam":          exam,
		"record":        record,
		"questions":     questions,
		"scoreReleased": true,
	})
}

func GetExamHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "用户未认证")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	var records []models.ExamRecord
	var total int64

	offset := (page - 1) * pageSize

	models.DB.Model(&models.ExamRecord{}).Where("student_id = ?", userID).Count(&total)
	models.DB.Where("student_id = ?", userID).Order("created_at desc").Offset(offset).Limit(pageSize).Find(&records)

	type RecordWithExam struct {
		models.ExamRecord
		Exam models.Exam `json:"exam"`
	}

	result := make([]RecordWithExam, 0, len(records))
	for _, record := range records {
		var exam models.Exam
		models.DB.First(&exam, record.ExamID)
		result = append(result, RecordWithExam{
			ExamRecord: record,
			Exam:       exam,
		})
	}

	utils.Success(c, gin.H{
		"list":     result,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func GetPendingGrading(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var teacherClasses []models.TeacherClass
	models.DB.Where("teacher_id = ?", userID).Find(&teacherClasses)

	classIDs := make([]uint, 0)
	for _, tc := range teacherClasses {
		classIDs = append(classIDs, tc.ClassID)
	}

	var exams []models.Exam
	if len(classIDs) > 0 {
		models.DB.Where("created_by = ? OR class_id IN ?", userID, classIDs).Find(&exams)
	} else {
		models.DB.Where("created_by = ?", userID).Find(&exams)
	}

	examIDs := make([]uint, len(exams))
	for i, exam := range exams {
		examIDs[i] = exam.ID
	}

	if len(examIDs) == 0 {
		utils.Success(c, gin.H{
			"list":     []interface{}{},
			"total":    0,
			"page":     1,
			"pageSize": 10,
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	var records []models.ExamRecord
	var total int64

	offset := (page - 1) * pageSize

	models.DB.Model(&models.ExamRecord{}).
		Where("exam_id IN ? AND status = ? AND grading_status = ?", examIDs, "submitted", "pending").
		Count(&total)

	models.DB.Where("exam_id IN ? AND status = ? AND grading_status = ?", examIDs, "submitted", "pending").
		Order("submit_time asc").
		Offset(offset).Limit(pageSize).
		Find(&records)

	type RecordWithDetails struct {
		Record       models.ExamRecord `json:"record"`
		Exam         models.Exam       `json:"exam"`
		StudentName  string            `json:"studentName"`
		ClassName    string            `json:"className"`
		PendingCount int               `json:"pendingCount"`
		TotalEssay   int               `json:"totalEssay"`
	}

	result := make([]RecordWithDetails, 0, len(records))
	for _, record := range records {
		var exam models.Exam
		models.DB.First(&exam, record.ExamID)

		var student models.User
		models.DB.Preload("Class").First(&student, record.StudentID)

		className := ""
		if student.Class != nil {
			className = student.Class.Name
		}

		var examQuestions []models.ExamQuestion
		models.DB.Where("exam_id = ?", record.ExamID).Find(&examQuestions)

		var questionIDs []uint
		for _, eq := range examQuestions {
			questionIDs = append(questionIDs, eq.QuestionID)
		}

		var essayQuestions []models.Question
		models.DB.Where("id IN ? AND type = ?", questionIDs, "essay").Find(&essayQuestions)

		essayQuestionIDs := make([]uint, 0)
		for _, q := range essayQuestions {
			essayQuestionIDs = append(essayQuestionIDs, q.ID)
		}

		var pendingAnswers []models.Answer
		if len(essayQuestionIDs) > 0 {
			models.DB.Where("record_id = ? AND question_id IN ? AND is_graded = ?", record.ID, essayQuestionIDs, false).Find(&pendingAnswers)
		}

		result = append(result, RecordWithDetails{
			Record:       record,
			Exam:         exam,
			StudentName:  student.Name,
			ClassName:    className,
			PendingCount: len(pendingAnswers),
			TotalEssay:   len(essayQuestions),
		})
	}

	utils.Success(c, gin.H{
		"list":     result,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func GetStudentAnswersForGrading(c *gin.Context) {
	userID, _ := c.Get("user_id")
	recordID := c.Param("recordId")

	var record models.ExamRecord
	if err := models.DB.First(&record, recordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	var exam models.Exam
	models.DB.Preload("Class").First(&exam, record.ExamID)

	var student models.User
	models.DB.Preload("Class").First(&student, record.StudentID)

	var teacherClasses []models.TeacherClass
	models.DB.Where("teacher_id = ?", userID).Find(&teacherClasses)

	classIDs := make([]uint, 0)
	for _, tc := range teacherClasses {
		classIDs = append(classIDs, tc.ClassID)
	}

	hasAccess := exam.CreatedBy == userID.(uint)
	if !hasAccess && len(classIDs) > 0 {
		for _, classID := range classIDs {
			if exam.ClassID != nil && *exam.ClassID == classID {
				hasAccess = true
				break
			}
			if student.ClassID != nil && *student.ClassID == classID {
				hasAccess = true
				break
			}
		}
	}

	if !hasAccess {
		utils.Forbidden(c, "无权访问此试卷")
		return
	}

	var examQuestions []models.ExamQuestion
	models.DB.Where("exam_id = ?", record.ExamID).Order("sort").Find(&examQuestions)

	var answers []models.Answer
	models.DB.Where("record_id = ?", recordID).Find(&answers)

	answerMap := make(map[uint]models.Answer)
	for _, ans := range answers {
		answerMap[ans.QuestionID] = ans
	}

	type QuestionForGrading struct {
		QuestionID     uint     `json:"questionId"`
		Sort           int      `json:"sort"`
		Content        string   `json:"content"`
		Type           string   `json:"type"`
		Options        *string  `json:"options"`
		MaxScore       int      `json:"maxScore"`
		CorrectAnswer  string   `json:"correctAnswer"`
		StudentAnswer  string   `json:"studentAnswer"`
		TeacherScore   *float64 `json:"teacherScore"`
		TeacherComment *string  `json:"teacherComment"`
		IsGraded       bool     `json:"isGraded"`
		IsCorrect      *bool    `json:"isCorrect"`
		Score          *float64 `json:"score"`
	}

	questions := make([]QuestionForGrading, 0, len(examQuestions))
	for _, eq := range examQuestions {
		var question models.Question
		models.DB.First(&question, eq.QuestionID)

		item := QuestionForGrading{
			QuestionID:    eq.QuestionID,
			Sort:          eq.Sort,
			Content:       question.Content,
			Type:          question.Type,
			Options:       question.Options,
			MaxScore:      eq.Score,
			CorrectAnswer: question.Answer,
		}

		if ans, exists := answerMap[eq.QuestionID]; exists {
			item.StudentAnswer = ans.StudentAnswer
			item.TeacherScore = ans.TeacherScore
			item.TeacherComment = ans.TeacherComment
			item.IsGraded = ans.IsGraded
			item.IsCorrect = ans.IsCorrect
			item.Score = ans.Score
		}

		questions = append(questions, item)
	}

	className := ""
	if student.Class != nil {
		className = student.Class.Name
	}

	utils.Success(c, gin.H{
		"record":    record,
		"exam":      exam,
		"student":   student,
		"className": className,
		"questions": questions,
	})
}

func GradeAnswer(c *gin.Context) {
	var req struct {
		RecordID       uint     `json:"recordId" binding:"required"`
		QuestionID     uint     `json:"questionId" binding:"required"`
		TeacherScore   *float64 `json:"teacherScore" binding:"required"`
		TeacherComment string   `json:"teacherComment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误：请输入有效的分数")
		return
	}

	if req.TeacherScore == nil {
		utils.BadRequest(c, "请输入分数")
		return
	}

	var record models.ExamRecord
	if err := models.DB.First(&record, req.RecordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	var exam models.Exam
	models.DB.First(&exam, record.ExamID)

	var examQuestion models.ExamQuestion
	if err := models.DB.Where("exam_id = ? AND question_id = ?", record.ExamID, req.QuestionID).First(&examQuestion).Error; err != nil {
		utils.BadRequest(c, "题目不存在")
		return
	}

	if *req.TeacherScore < 0 || *req.TeacherScore > float64(examQuestion.Score) {
		utils.BadRequest(c, fmt.Sprintf("分数必须在0到%d之间", examQuestion.Score))
		return
	}

	var answer models.Answer
	err := models.DB.Where("record_id = ? AND question_id = ?", req.RecordID, req.QuestionID).First(&answer).Error

	if err != nil {
		answer = models.Answer{
			RecordID:       req.RecordID,
			QuestionID:     req.QuestionID,
			TeacherScore:   req.TeacherScore,
			TeacherComment: &req.TeacherComment,
			IsGraded:       true,
		}
		models.DB.Create(&answer)
	} else {
		answer.TeacherScore = req.TeacherScore
		answer.TeacherComment = &req.TeacherComment
		answer.IsGraded = true
		models.DB.Save(&answer)
	}

	var totalAnswers int64
	var gradedAnswers int64
	models.DB.Model(&models.Answer{}).Where("record_id = ?", req.RecordID).Count(&totalAnswers)
	models.DB.Model(&models.Answer{}).Where("record_id = ? AND is_graded = ?", req.RecordID, true).Count(&gradedAnswers)

	if int(gradedAnswers) == int(totalAnswers) {
		calculateFinalScore(req.RecordID)
	}

	var updatedRecord models.ExamRecord
	models.DB.First(&updatedRecord, req.RecordID)

	utils.Success(c, gin.H{
		"answer":        answer,
		"gradingStatus": updatedRecord.GradingStatus,
		"totalAnswers":  totalAnswers,
		"gradedAnswers": gradedAnswers,
	})
}

func ReleaseScores(c *gin.Context) {
	var req struct {
		RecordID uint `json:"recordId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var record models.ExamRecord
	if err := models.DB.First(&record, req.RecordID).Error; err != nil {
		utils.BadRequest(c, "考试记录不存在")
		return
	}

	if record.GradingStatus != "completed" {
		var examQuestions []models.ExamQuestion
		models.DB.Where("exam_id = ?", record.ExamID).Find(&examQuestions)

		questionIDs := make([]uint, 0)
		for _, eq := range examQuestions {
			questionIDs = append(questionIDs, eq.QuestionID)
		}

		var questions []models.Question
		models.DB.Where("id IN ?", questionIDs).Find(&questions)

		questionTypeMap := make(map[uint]string)
		for _, q := range questions {
			questionTypeMap[q.ID] = q.Type
		}

		var essayCount int = 0
		var ungradedEssayCount int = 0
		for _, q := range questions {
			if q.Type == "essay" {
				essayCount++
				var answer models.Answer
				if err := models.DB.Where("record_id = ? AND question_id = ?", req.RecordID, q.ID).First(&answer).Error; err != nil || !answer.IsGraded {
					ungradedEssayCount++
				}
			}
		}

		if ungradedEssayCount > 0 {
			utils.BadRequest(c, fmt.Sprintf("还有 %d 道主观题未评分", ungradedEssayCount))
			return
		}

		calculateFinalScore(req.RecordID)
		models.DB.First(&record, req.RecordID)
	} else {
		calculateFinalScore(req.RecordID)
		models.DB.First(&record, req.RecordID)
	}

	record.ScoreReleased = true
	models.DB.Save(&record)

	utils.Success(c, record)
}
