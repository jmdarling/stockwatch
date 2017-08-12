// dotenv
require('dotenv').config()

// Third party deps.
const alphavantage = require('alphavantage')
const express = require('express')
const http = require('http')
const redis = require('redis')
const socketIo = require('socket.io')

// Core deps.
const config = require('./config')

// Services.
const alphavantageDataServiceFactory = require('./services/alphavantageDataServiceFactory')
const CachePrimeService = require('./services/cachePrimeService')

// Middlewares.
const corsMiddleware = require('./middlewares/corsMiddleware')

// Bootstrapping.
const app = express()
const httpServer = http.Server(app)
const redisClient = redis.createClient(config.redisUrl)
const socketServer = socketIo(httpServer)

const alphavantageClient = alphavantage({ key: config.alphavantageApiKey })
const cachePrimeService = new CachePrimeService(redisClient)
const alphavantageDataService = alphavantageDataServiceFactory(alphavantageClient, cachePrimeService, redisClient)

httpServer.listen(8080)

app.use(corsMiddleware)

app.get('/mostrecentquotes/:tickerSymbol', ({ params }, response) => {
  const { tickerSymbol } = params

  alphavantageDataService.getLast60MinutesByMinute(tickerSymbol)
    .then(last60MinutesByMinute => {
      response.send(last60MinutesByMinute)
    })
})
