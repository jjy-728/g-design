package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type ServerConfig struct {
	Port string `yaml:"port"`
	Mode string `yaml:"mode"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	Charset  string `yaml:"charset"`
}

type JWTConfig struct {
	Secret string `yaml:"secret"`
	Expire string `yaml:"expire"`
}

type AIConfig struct {
	APIKey  string `yaml:"api_key"`
	BaseURL string `yaml:"base_url"`
	Model   string `yaml:"model"`
}

type RedisConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
	PoolSize int    `yaml:"pool_size"`
}

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
	AI       AIConfig       `yaml:"ai"`
	Redis    RedisConfig    `yaml:"redis"`
}

var GlobalConfig *Config

func LoadConfig(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("failed to parse config file: %w", err)
	}

	GlobalConfig = &config
	return nil
}

func GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		GlobalConfig.Database.Username,
		GlobalConfig.Database.Password,
		GlobalConfig.Database.Host,
		GlobalConfig.Database.Port,
		GlobalConfig.Database.DBName,
		GlobalConfig.Database.Charset,
	)
}
