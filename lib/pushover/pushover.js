
/**
Async send a pushover notification
*/
sendPushover = function (title, message, url = null, url_title = null, priority = 0) {
  // per https://pushover.net/api
  const pushurl = "https://api.pushover.net/1/messages.json"

  if(!Meteor.settings.private.pushover) {
    console.warn("Pushover reporting is disabled until you set Meteor.settings.private.pushover.{token & user}")
  }
  else {
    const opts = {
      params: {
        token: Meteor.settings.private.pushover.token,
        user: Meteor.settings.private.pushover.user,
        message,
        priority
      },
      timeout: 5000 // If we can't reach pushover just fail
    }

    if(title)
      opts.params.title = title

    if(url)
      opts.params.url = url

    if(url_title)
      opt.params.url_title = url_title

    HTTP.post(pushurl, opts, (error, result) => {
      if(error)
        console.error("Ignoring error contacting pushover.net", error)
    })
  }
}

// A map from key to date
const sentMessages = new Map()

/**
 Used to avoid spamming for duplicate problems

 If key has occurred more than once in the last hour we will drop new messages for that key
 */
sendPushoverThrottled = function (key, title, message, url = null, url_title = null, priority = 0) {
  const now = new Date()
  let lasttime = sentMessages.get(key)
  if((now - lasttime) < 60 * 60 * 1000)
    console.warn("Ignoring redundant pushover", message)
  else {
    sentMessages.set(key, now)
    sendPushover(title, message, url, url_title, priority)
  }
}
