package middleware

import (
	"github.com/gin-gonic/gin"
	"g-design-server/models"
	"g-design-server/utils"
)

func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.Unauthorized(c, "未认证")
			c.Abort()
			return
		}

		u := user.(*models.User)
		
		if u.Role.Name == "admin" {
			c.Next()
			return
		}

		permissions, exists := c.Get("permissions")
		if !exists {
			utils.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		userPermissions := permissions.([]models.Permission)
		hasPermission := false
		for _, p := range userPermissions {
			if p.Name == permission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			utils.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireRole(roleName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.Unauthorized(c, "未认证")
			c.Abort()
			return
		}

		u := user.(*models.User)
		if u.Role.Name != roleName {
			utils.Forbidden(c, "角色权限不足")
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireRoles(roleNames ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.Unauthorized(c, "未认证")
			c.Abort()
			return
		}

		u := user.(*models.User)
		hasRole := false
		for _, roleName := range roleNames {
			if u.Role.Name == roleName {
				hasRole = true
				break
			}
		}

		if !hasRole {
			utils.Forbidden(c, "角色权限不足")
			c.Abort()
			return
		}

		c.Next()
	}
}
