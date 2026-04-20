package redis

import (
	"context"
	"fmt"
	"log"
	"time"

	"g-design-server/config"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client
var Ctx = context.Background()

func InitRedis() error {
	Client = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", config.GlobalConfig.Redis.Host, config.GlobalConfig.Redis.Port),
		DB:       config.GlobalConfig.Redis.DB,
		PoolSize: config.GlobalConfig.Redis.PoolSize,
	})

	_, err := Client.Ping(Ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to redis: %w", err)
	}

	log.Println("Redis connected successfully")
	return nil
}

func CloseRedis() {
	if Client != nil {
		Client.Close()
	}
}

func Set(key string, value interface{}, expiration time.Duration) error {
	return Client.Set(Ctx, key, value, expiration).Err()
}

func Get(key string) (string, error) {
	return Client.Get(Ctx, key).Result()
}

func Del(keys ...string) error {
	return Client.Del(Ctx, keys...).Err()
}

func Exists(key string) (bool, error) {
	result, err := Client.Exists(Ctx, key).Result()
	return result > 0, err
}

func Expire(key string, expiration time.Duration) error {
	return Client.Expire(Ctx, key, expiration).Err()
}

func TTL(key string) (time.Duration, error) {
	return Client.TTL(Ctx, key).Result()
}

func Incr(key string) (int64, error) {
	return Client.Incr(Ctx, key).Result()
}

func Decr(key string) (int64, error) {
	return Client.Decr(Ctx, key).Result()
}

func SetNX(key string, value interface{}, expiration time.Duration) (bool, error) {
	return Client.SetNX(Ctx, key, value, expiration).Result()
}
