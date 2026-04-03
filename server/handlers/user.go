package handlers

import (
	"g-design-server/models"
	"g-design-server/utils"

	"github.com/gin-gonic/gin"
)

type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	RoleID   uint   `json:"role_id" binding:"required"`
}

type UpdateUserRequest struct {
	Name   string `json:"name" binding:"omitempty,min=2,max=50"`
	Email  string `json:"email" binding:"omitempty,email"`
	RoleID uint   `json:"role_id"`
	Status *int   `json:"status"`
}

type UserResponse struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	RoleID    uint   `json:"role_id"`
	RoleName  string `json:"role_name"`
	Status    int    `json:"status"`
	CreatedAt string `json:"created_at"`
}

func GetUsers(c *gin.Context) {
	var users []models.User
	if err := models.DB.Preload("Role").Find(&users).Error; err != nil {
		utils.InternalServerError(c, "获取用户列表失败")
		return
	}

	response := make([]UserResponse, 0, len(users))
	for _, user := range users {
		response = append(response, UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Name:      user.Name,
			Email:     user.Email,
			RoleID:    user.RoleID,
			RoleName:  user.Role.Name,
			Status:    user.Status,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	utils.Success(c, gin.H{
		"list":  response,
		"total": len(response),
	})
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var existingUser models.User
	if err := models.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "用户名已存在")
		return
	}

	if err := models.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "邮箱已被注册")
		return
	}

	var role models.Role
	if err := models.DB.First(&role, req.RoleID).Error; err != nil {
		utils.BadRequest(c, "角色不存在")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.InternalServerError(c, "密码加密失败")
		return
	}

	user := models.User{
		Username: req.Username,
		Password: hashedPassword,
		Name:     req.Name,
		Email:    req.Email,
		RoleID:   req.RoleID,
		Status:   1,
	}

	if err := models.DB.Create(&user).Error; err != nil {
		utils.InternalServerError(c, "创建用户失败")
		return
	}

	utils.Success(c, gin.H{
		"message": "创建成功",
		"user_id": user.ID,
	})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var user models.User
	if err := models.DB.First(&user, id).Error; err != nil {
		utils.BadRequest(c, "用户不存在")
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		var existingUser models.User
		if err := models.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			utils.BadRequest(c, "邮箱已被使用")
			return
		}
		user.Email = req.Email
	}
	if req.RoleID != 0 {
		var role models.Role
		if err := models.DB.First(&role, req.RoleID).Error; err != nil {
			utils.BadRequest(c, "角色不存在")
			return
		}
		user.RoleID = req.RoleID
	}
	if req.Status != nil {
		user.Status = *req.Status
	}

	if err := models.DB.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "更新用户失败")
		return
	}

	utils.Success(c, gin.H{
		"message": "更新成功",
	})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := models.DB.First(&user, id).Error; err != nil {
		utils.BadRequest(c, "用户不存在")
		return
	}

	if err := models.DB.Delete(&user).Error; err != nil {
		utils.InternalServerError(c, "删除用户失败")
		return
	}

	utils.Success(c, gin.H{
		"message": "删除成功",
	})
}
