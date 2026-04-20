package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"g-design-server/config"
)

type Claims struct {
	UserID   uint   `json:"user_id"`
	Name     string `json:"name"`
	RoleID   uint   `json:"role_id"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, name string, roleID uint) (string, error) {
	claims := Claims{
		UserID:   userID,
		Name:     name,
		RoleID:   roleID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.GlobalConfig.JWT.Secret))
}

func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(config.GlobalConfig.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
