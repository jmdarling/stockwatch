module.exports = {
  alphavantageApiKey: process.env.ALPHAVANTAGE_API_KEY,
  port: process.env.PORT | 8080,
  redisUrl: process.env.REDIS_URL | '//localhost:6379'
}
