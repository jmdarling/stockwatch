module.exports = function alphavantageDataServiceFactory (alphavantageClient, cachePrimeService, redisClient) {
  return {
    /**
     * Fetches the last 60 minutes of pricing data by the minute.
     * 
     * @param {string} tickerSymbol
     *
     * @returns {Promise<any>} The last 60 minutes of pricing data by the minute.
     */
    getLast60MinutesByMinute: function getLast60MinutesByMinute (tickerSymbol) {
      const cacheKey = `${tickerSymbol}:INTRADAY`

      const dataFunction = () => {
        return alphavantageClient.data.intraday(tickerSymbol)
          .then(data => {
            return _mapTickerDataMapToArray(data['Time Series (1min)']).slice(0, 60)
          })
      }

      cachePrimeService.primeCache(cacheKey, dataFunction, 3600, 60)

      return new Promise((resolve, reject) => {
        redisClient.get(cacheKey, (error, response) => {
          if (error != null) {
            reject(error)
          }

          if (response != null) {
            resolve(JSON.parse(response))
            return
          }

          dataFunction()
            .then(tickerData => {
              resolve(tickerData)
              redisClient.set(cacheKey, JSON.stringify(tickerData), 'EX', 60)
            })
        })
      })
    }
  }
}

function _mapTickerDataMapToArray (tickerDataMap) {
  const tickerDataList = []

  for (let tickerDataTimestamp in tickerDataMap) {
    if (!tickerDataMap.hasOwnProperty(tickerDataTimestamp)) {
      continue
    }

    tickerDataList.push({
      timeStamp: new Date(tickerDataTimestamp),
      open: tickerDataMap[tickerDataTimestamp]['1. open'],
      high: tickerDataMap[tickerDataTimestamp]['2. high'],
      low: tickerDataMap[tickerDataTimestamp]['3. low'],
      close: tickerDataMap[tickerDataTimestamp]['4. close'],
      volume: tickerDataMap[tickerDataTimestamp]['5. volume']
    })
  }

  const sortedTickerData = tickerDataList.sort((a, b) => {
    if (a.timeStamp > b.timeStamp) {
      return 1
    }

    if (a.timeStamp < b.timeStamp) {
      return -1
    }

    return 0
  })

  return sortedTickerData
}
