const debug = require('debug')('stockwatch:cachePrimeService')

module.exports = class CachePrimeService {
  constructor (redisClient) {
    this._redisClient = redisClient

    this.primeTimeouts = {}
  }

  primeCache (cacheKey, dataFunction, primeDurationSeconds, primeIntervalSeconds) {
    if (this.primeTimeouts.hasOwnProperty(cacheKey)) {
      if (this.primeTimeouts[cacheKey] < primeDurationSeconds) {
        debug(`refreshed: ${cacheKey}`)
        this.primeTimeouts[cacheKey] = primeDurationSeconds
      }

      return
    }

    debug(`started: ${cacheKey}`)
    this.primeTimeouts[cacheKey] = primeDurationSeconds
    this._doPrimeCache(cacheKey, dataFunction, primeIntervalSeconds)
  }

  _doPrimeCache (cacheKey, dataFunction, primeIntervalSeconds) {
    if (this.primeTimeouts[cacheKey] < primeIntervalSeconds) {
      debug(`expired: ${cacheKey}`)
      delete this.primeTimeouts[cacheKey]
      return
    }

    debug(`primed: ${cacheKey}`)
    this.primeTimeouts[cacheKey] = this.primeTimeouts[cacheKey] - primeIntervalSeconds

    dataFunction()
      .then(data => {
        this._redisClient.set(cacheKey, JSON.stringify(data), 'EX', primeIntervalSeconds)
      })

    setTimeout(() => {
      this._doPrimeCache(cacheKey, dataFunction, primeIntervalSeconds)
    }, primeIntervalSeconds * 1000)
  }
}
