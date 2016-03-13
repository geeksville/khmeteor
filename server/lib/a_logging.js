
// Add & configure the console transport
/* REMOVED - used with Winston logger

logger.addTransport('console', {
    colorize: true,
    level: 'debug',
    levels : {debug: 0, info : 1, warn: 2, error: 3},
    colors : {debug: 'blue', info : 'green', warn: 'orange', error: 'red'},
    handleExeptions: true,
    humanReadableUnhandledException: true,
})
*/

// FIXME - add this to the lib itself
//Loggly.prototype.debug = function () {
//  this._applyArguments(arguments, 'trace')
//}

// console.info("LOGGING!")



// Setup the loggly logger
const settings = Meteor.settings.private.loggly
if(settings)
  Logger = new Loggly({
        token: settings.token,
        subdomain: settings.subdomain,
        //auth: {
        //  username: settings.username,
        //  password: settings.password
        //},
        //
        // Optional: Tag to send with EVERY log message
        //
        // tags: ['global-tag'],
        // Optional: logs will be stored in JSON format
        json: true
      })

class MyLogger {
  constructor() {
    // For pince
    const pince = Package["jag:pince"]
    pince.Logger.setLevel('debug')
    this.plog = new pince.Logger('default')
  }

  debug(...args) { this.log('debug', ...args) }
  warn(...args) { this.log('warn', ...args) }
  info(...args) { this.log('info', ...args) }
  trace(...args) { this.log('trace', ...args) }
  error(...args) { this.log('error', ...args) }

  log(level, message, ...args) {
    // Log locally using pince
    this.plog.log(level, message, ...args)

    // If not trace (we never send that to loggly) then send rest to loggly
    if(level != "trace") {
      // Hide the msg as an extra object field in the args array
      const logobj = { msg: message }
      logobj.args = args
      if(settings)
        Logger.log(logobj, level) // Forward to loggly
    }
  }
}

// We prefer to use logger (to keep compatible with other libs)
logger = new MyLogger()
