package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"g-design-server/config"
	"g-design-server/utils"

	"github.com/gin-gonic/gin"
)

type GenerateQuestionsRequest struct {
	KnowledgePoint string `json:"knowledgePoint" binding:"required"`
	Difficulty     int    `json:"difficulty" binding:"required,min=1,max=5"`
	QuestionType   string `json:"questionType" binding:"required"`
	Count          int    `json:"count" binding:"required,min=1,max=20"`
}

type QuestionData struct {
	Content        string   `json:"content"`
	Type           string   `json:"type"`
	Options        []string `json:"options,omitempty"`
	Answer         string   `json:"answer"`
	Explanation    string   `json:"explanation"`
	KnowledgePoint string   `json:"knowledgePoint"`
	Difficulty     int      `json:"difficulty"`
}

type AIResponse struct {
	Questions []QuestionData `json:"questions"`
}

type DeepSeekRequest struct {
	Model    string            `json:"model"`
	Messages []DeepSeekMessage `json:"messages"`
}

type DeepSeekMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DeepSeekResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func GenerateQuestions(c *gin.Context) {
	var req GenerateQuestionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	prompt := fmt.Sprintf(
		"你是一个专业的出题助手。请根据以下条件生成题目：\n"+
			"知识点：%s\n"+
			"难度等级：%d (1-5)\n"+
			"题型：%s\n"+
			"数量：%d\n\n"+
			"请以 JSON 数组格式返回，严格遵守以下格式要求：\n"+
			"- content: 题目内容\n"+
			"- type: 题型 (与输入一致: single, multiple, fill, essay)\n"+
			"- options: 选项数组 (仅针对 single 和 multiple 题型)。**注意：选项内容不要包含 'A.' 'B.' 等前缀**。\n"+
			"- answer: 正确答案。**注意：如果是单选题或多选题，请只返回选项对应的字母（如 'A' 或 'A,B'），不要包含选项内容**。\n"+
			"- explanation: 题目解析\n"+
			"- knowledgePoint: 知识点\n"+
			"- difficulty: 难度等级\n\n"+
			"请直接返回 JSON 数组，不要包含任何 markdown 格式代码块或额外文字。",
		req.KnowledgePoint, req.Difficulty, req.QuestionType, req.Count,
	)

	dsReq := DeepSeekRequest{
		Model: config.GlobalConfig.AI.Model,
		Messages: []DeepSeekMessage{
			{Role: "system", Content: "你是一个专业的出题助手，只返回 JSON 格式数据。"},
			{Role: "user", Content: prompt},
		},
	}

	jsonData, err := json.Marshal(dsReq)
	if err != nil {
		utils.InternalServerError(c, "请求构造失败")
		return
	}

	httpReq, err := http.NewRequest("POST", config.GlobalConfig.AI.BaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		utils.InternalServerError(c, "创建请求失败")
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+config.GlobalConfig.AI.APIKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		utils.InternalServerError(c, "调用 AI 服务失败")
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		utils.InternalServerError(c, "读取响应失败")
		return
	}

	if resp.StatusCode != http.StatusOK {
		utils.InternalServerError(c, fmt.Sprintf("AI 服务返回错误: %s", string(body)))
		return
	}

	var dsResp DeepSeekResponse
	if err := json.Unmarshal(body, &dsResp); err != nil {
		utils.InternalServerError(c, "解析 AI 响应失败")
		return
	}

	if len(dsResp.Choices) == 0 {
		utils.InternalServerError(c, "AI 未返回有效内容")
		return
	}

	content := dsResp.Choices[0].Message.Content
	
	// 清理 AI 可能返回的 markdown 代码块格式
	content = strings.TrimSpace(content)
	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimSuffix(content, "```")
	} else if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")
	}
	content = strings.TrimSpace(content)

	var questions []QuestionData
	if err := json.Unmarshal([]byte(content), &questions); err != nil {
		utils.InternalServerError(c, "解析题目数据失败: "+content)
		return
	}

	utils.Success(c, gin.H{
		"questions": questions,
	})
}
