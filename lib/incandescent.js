

const endpoint_add = "https://incandescent.xyz/api/add/"
const endpoint_get = "https://incandescent.xyz/api/get/"

function genExpire() {
  const unixtime = new Date().getTime() / 1000
  return Math.round(unixtime) + 10 * 60 // 10min from now
}

Incandescent = class Incandescent {
  constructor(keyObj) {
    this.keyObj = keyObj
  }

  _getAuth(expires) {
    const tohash = `${this.keyObj.uid}-${expires}-${this.keyObj.apikey}`


    return CryptoJS.MD5(tohash).toString(CryptoJS.enc.Hex)
  }

  /** starts a search, returns the project_id */
  addImage(imgUrl) {
    const expires = genExpire()
    const auth = this._getAuth(expires)
    const payload = {
      uid: this.keyObj.uid,
      expires,
      auth,
      images: [ imgUrl ],
      multiple: 1
    }

    const resp = HTTP.post(endpoint_add, { data: payload })

    logger.info("incadencent add result", payload, resp)

    if(resp.data.status != 200 && resp.data.status != 201)
      throw new Error("image checker didn't like us", resp.data.status)

    if(!resp.data.project_id)
      throw new Error("no project id")

    return resp.data.project_id
  }

  tryGetResults(project_id) {
    const expires = genExpire()
    const auth = this._getAuth(expires)
    const payload = {
      uid: this.keyObj.uid,
      expires,
      auth,
      project_id
    }

    const resp = HTTP.post(endpoint_get, { data: payload })

    logger.info("incadencent get result", payload, resp)

    return resp.data
  }

  checkImage(imgUrl) {
    const id = this.addImage(imgUrl)
    var results = null

    // FIXME timeout eventually
    while(!results) {
      const get = this.tryGetResults(id)
      if(!('status' in get))
        results = get // Must have gotten valid results
      else {
        if(get.status == 755)
          return null // Nothing found
        else if(get.status == 710)
          Meteor.sleep(2000)
        else
          throw new Error("Unexpected image lookup status", get.status)
      }
    }
  }
}
