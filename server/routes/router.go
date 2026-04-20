package routes

import (
	"github.com/gin-gonic/gin"
	"g-design-server/handlers"
	"g-design-server/middleware"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/register", handlers.Register)
		}

		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			user.GET("/current", handlers.GetCurrentUser)
			user.POST("/logout", handlers.Logout)
		}

		dashboard := api.Group("/dashboard")
		dashboard.Use(middleware.AuthMiddleware())
		{
			dashboard.GET("/stats", handlers.GetDashboardStats)
		}

		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware(), middleware.RequirePermission("user:manage"))
		{
			users.GET("", handlers.GetUsers)
			users.POST("", handlers.CreateUser)
			users.PUT("/:id", handlers.UpdateUser)
			users.DELETE("/:id", handlers.DeleteUser)
		}

		classes := api.Group("/classes")
		classes.Use(middleware.AuthMiddleware())
		{
			classes.GET("", handlers.GetClasses)
			classes.GET("/:id", handlers.GetClass)
			classes.POST("", handlers.CreateClass)
			classes.PUT("/:id", handlers.UpdateClass)
			classes.DELETE("/:id", handlers.DeleteClass)
			classes.POST("/assign-teacher", handlers.AssignTeacherToClass)
			classes.DELETE("/remove-teacher", handlers.RemoveTeacherFromClass)
			classes.GET("/teacher/my-classes", handlers.GetTeacherClasses)
			classes.GET("/:id/students", handlers.GetClassStudents)
			classes.POST("/assign-student", handlers.AssignStudentToClass)
		}

		ai := api.Group("/ai")
		ai.Use(middleware.AuthMiddleware())
		{
			ai.POST("/generate-questions", handlers.GenerateQuestions)
		}

		questions := api.Group("/questions")
		questions.Use(middleware.AuthMiddleware())
		{
			questions.GET("", handlers.GetQuestions)
			questions.POST("", handlers.CreateQuestion)
			questions.POST("/batch", handlers.CreateQuestionsBatch)
			questions.PUT("/:id", handlers.UpdateQuestion)
			questions.DELETE("/:id", handlers.DeleteQuestion)
			questions.DELETE("/batch", handlers.DeleteQuestionsBatch)
		}

		exams := api.Group("/exams")
		exams.Use(middleware.AuthMiddleware())
		{
			exams.GET("", handlers.GetExams)
			exams.GET("/:id", handlers.GetExamDetail)
			exams.POST("/generate", handlers.GenerateExam)
			exams.POST("", handlers.CreateExam)
			exams.DELETE("/:id", handlers.DeleteExam)
		}

		examRecords := api.Group("/exam-records")
		examRecords.Use(middleware.AuthMiddleware())
		{
			examRecords.GET("/available", handlers.GetAvailableExams)
			examRecords.GET("/history", handlers.GetExamHistory)
			examRecords.GET("/exam/:id", handlers.GetExamInfo)
			examRecords.POST("/start", handlers.StartExam)
			examRecords.GET("/questions/:recordId", handlers.GetExamQuestions)
			examRecords.POST("/answer", handlers.SaveAnswer)
			examRecords.POST("/toggle-mark", handlers.ToggleMark)
			examRecords.POST("/submit", handlers.SubmitExam)
			examRecords.GET("/result/:recordId", handlers.GetExamResult)
		}

		grading := api.Group("/grading")
		grading.Use(middleware.AuthMiddleware())
		{
			grading.GET("/pending", handlers.GetPendingGrading)
			grading.GET("/student/:recordId", handlers.GetStudentAnswersForGrading)
			grading.POST("/grade", handlers.GradeAnswer)
			grading.POST("/release", handlers.ReleaseScores)
		}
	}
}
