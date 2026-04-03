package utils

import "github.com/gin-gonic/gin"

type Response struct {
	Code int         `json:"code"`
	Data interface{} `json:"data,omitempty"`
	Msg  string      `json:"msg,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code: 200,
		Data: data,
	})
}

func Error(c *gin.Context, code int, msg string) {
	c.JSON(code, Response{
		Code: code,
		Msg:  msg,
	})
}

func Unauthorized(c *gin.Context, msg string) {
	c.JSON(401, Response{
		Code: 401,
		Msg:  msg,
	})
}

func Forbidden(c *gin.Context, msg string) {
	c.JSON(403, Response{
		Code: 403,
		Msg:  msg,
	})
}

func BadRequest(c *gin.Context, msg string) {
	c.JSON(400, Response{
		Code: 400,
		Msg:  msg,
	})
}

func InternalServerError(c *gin.Context, msg string) {
	c.JSON(500, Response{
		Code: 500,
		Msg:  msg,
	})
}
