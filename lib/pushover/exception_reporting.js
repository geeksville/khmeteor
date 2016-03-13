
// Messages we should ignore
exceptionsToIgnore = [
  "Error 404: Subreddit Not found [404]",
  "Reddit error response 401 [401]", // Unauthorized - can show for either reddit bug (because we lost auth or because)
  "Reddit error response 403 [403]" // Forbidden
]

/**
 Report an exception in the logs and possibly pushover
 */
exceptionReport = function (note, exception) {
  if(exceptionsToIgnore.indexOf(exception.message) >= 0)
    logger.trace("Ignoring exeption", exception)
  else {
    logger.trace("exception message", exception.message)
    const msg = exception.stack
    sendPushoverThrottled(note, note, msg)
    logger.error(note, msg)
  }
}
