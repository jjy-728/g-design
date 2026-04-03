package models

import (
	"time"

	_ "gorm.io/gorm"
)

type Role struct {
	ID          uint         `gorm:"primarykey" json:"id"`
	Name        string       `gorm:"type:varchar(50);uniqueIndex;not null" json:"name"`
	Description string       `gorm:"type:varchar(200)" json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions,omitempty"`
	Users       []User       `gorm:"foreignKey:RoleID" json:"users,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type Permission struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	Name        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description string    `gorm:"type:varchar(200)" json:"description"`
	Resource    string    `gorm:"type:varchar(50)" json:"resource"`
	Action      string    `gorm:"type:varchar(50)" json:"action"`
	Roles       []Role    `gorm:"many2many:role_permissions;" json:"roles,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type User struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Username  string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"`
	Name      string    `gorm:"type:varchar(50);not null" json:"name"`
	Email     string    `gorm:"type:varchar(100);uniqueIndex" json:"email"`
	Phone     string    `gorm:"type:varchar(20)" json:"phone"`
	RoleID    uint      `gorm:"not null;index" json:"role_id"`
	Role      Role      `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Status    int       `gorm:"default:1;comment:1-启用,0-禁用" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RolePermission struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	RoleID       uint       `gorm:"not null;index" json:"role_id"`
	PermissionID uint       `gorm:"not null;index" json:"permission_id"`
	Role         Role       `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Permission   Permission `gorm:"foreignKey:PermissionID" json:"permission,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}
