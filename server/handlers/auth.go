package handlers

import (
	"github.com/gin-gonic/gin"
	"g-design-server/models"
	"g-design-server/utils"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	RoleID   uint   `json:"role_id" binding:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  *UserInfo  `json:"user"`
}

type UserInfo struct {
	ID          uint                `json:"id"`
	Username    string              `json:"username"`
	Name        string              `json:"name"`
	Email       string              `json:"email"`
	RoleID      uint                `json:"role_id"`
	RoleName    string              `json:"role"`
	Permissions []PermissionInfo    `json:"permissions"`
}

type PermissionInfo struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var user models.User
	if err := models.DB.Preload("Role.Permissions").Where("username = ?", req.Username).First(&user).Error; err != nil {
		utils.Unauthorized(c, "用户名或密码错误")
		return
	}

	if !utils.CheckPassword(req.Password, user.Password) {
		utils.Unauthorized(c, "用户名或密码错误")
		return
	}

	if user.Status != 1 {
		utils.Unauthorized(c, "用户已被禁用")
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Username, user.RoleID)
	if err != nil {
		utils.InternalServerError(c, "生成令牌失败")
		return
	}

	permissions := make([]PermissionInfo, 0, len(user.Role.Permissions))
	for _, p := range user.Role.Permissions {
		permissions = append(permissions, PermissionInfo{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Resource:    p.Resource,
			Action:      p.Action,
		})
	}

	userInfo := &UserInfo{
		ID:          user.ID,
		Username:    user.Username,
		Name:        user.Name,
		Email:       user.Email,
		RoleID:      user.RoleID,
		RoleName:    user.Role.Name,
		Permissions: permissions,
	}

	utils.Success(c, LoginResponse{
		Token: token,
		User:  userInfo,
	})
}

func Register(c *gin.Context) {
	var req RegisterRequest
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
		utils.InternalServerError(c, "注册失败")
		return
	}

	utils.Success(c, gin.H{
		"message": "注册成功",
		"user_id": user.ID,
	})
}

func GetCurrentUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "未认证")
		return
	}

	u := user.(*models.User)

	permissions := make([]PermissionInfo, 0, len(u.Role.Permissions))
	for _, p := range u.Role.Permissions {
		permissions = append(permissions, PermissionInfo{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Resource:    p.Resource,
			Action:      p.Action,
		})
	}

	userInfo := &UserInfo{
		ID:          u.ID,
		Username:    u.Username,
		Name:        u.Name,
		Email:       u.Email,
		RoleID:      u.RoleID,
		RoleName:    u.Role.Name,
		Permissions: permissions,
	}

	utils.Success(c, userInfo)
}

func Logout(c *gin.Context) {
	utils.Success(c, gin.H{
		"message": "登出成功",
	})
}
