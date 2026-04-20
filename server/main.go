package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"g-design-server/config"
	"g-design-server/models"
	"g-design-server/redis"
	"g-design-server/routes"
)

func main() {
	if err := config.LoadConfig("config.yaml"); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := models.InitDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer models.CloseDB()

	if err := redis.InitRedis(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	}
	defer redis.CloseRedis()

	if err := models.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	gin.SetMode(config.GlobalConfig.Server.Mode)
	r := gin.Default()

	routes.SetupRoutes(r)

	log.Printf("Server starting on port %s", config.GlobalConfig.Server.Port)
	if err := r.Run(":" + config.GlobalConfig.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
