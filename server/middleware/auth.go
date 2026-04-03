package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"g-design-server/models"
	"g-design-server/utils"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "未提供认证信息")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			utils.Unauthorized(c, "认证格式错误")
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			utils.Unauthorized(c, "无效的令牌")
			c.Abort()
			return
		}

		var user models.User
		if err := models.DB.Preload("Role.Permissions").First(&user, claims.UserID).Error; err != nil {
			utils.Unauthorized(c, "用户不存在")
			c.Abort()
			return
		}

		if user.Status != 1 {
			utils.Unauthorized(c, "用户已被禁用")
			c.Abort()
			return
		}

		c.Set("user", &user)
		c.Set("user_id", user.ID)
		c.Set("role_id", user.RoleID)
		c.Set("role_name", user.Role.Name)
		c.Set("permissions", user.Role.Permissions)

		c.Next()
	}
}
