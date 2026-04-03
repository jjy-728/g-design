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

		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware(), middleware.RequirePermission("user:manage"))
		{
			users.GET("", handlers.GetUsers)
			users.POST("", handlers.CreateUser)
			users.PUT("/:id", handlers.UpdateUser)
			users.DELETE("/:id", handlers.DeleteUser)
		}
	}
}
