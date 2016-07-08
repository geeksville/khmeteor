FacebookClient = class FacebookClient {
  constructor(accessToken) {
    import fbgraph from 'fbgraph'
    this.fb = fbgraph
    this.fb.setAccessToken(accessToken)
      /* const options = {
          timeout: 3000,
          pool: {maxSockets: Infinity},
          headers: {connection: "keep-alive"}
      }
      this.fb.setOptions(options)
      */
    logger.debug('Facebook client created')
  }

  query(path, method = "get") {
    logger.debug(`calling fb ${path}`)
    const data = Async.runSync((done) => {
      this.fb[method](path, (err, res) => {
        done(null, res)
      })
    })
    logger.debug(`facebook results ${data}`)
    return data.result;
  }

  /**
   Note: this function returns only friends who are using this app!!!
  */
  getFriends() {
    return this.query("me/friends")
  }

  getUserData() {
    return this.query("me")
  }

}