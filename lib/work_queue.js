
/**
 This is a queue/map combination that allows units of work (callbacks)
 to be stored, and then run the unit of work in the background.  Only one
 unit will be run at a time (to ensure that we don't fire up too much
 in parallel).

 Client provides a key to describe the unit of work, if an existing key is
 already waiting in the queue then the new request will be discarded.

 FIXME - the notion of key checking might have been wrong to also include
 in this class...
 */
WorkQueue = class WorkQueue {
  constructor() {
    this.byKey = new Map()
    this.queue = []
    this.timeout = null
    this.startTime = null // Time we started the current operation
    this.curTimerNumber = 0 // We use this to indentify when we have a stale timer
    this.delay = 100 // Don't fire up new work items too quickly
  }

  schedule(key, callback) {
    if(this.byKey.has(key))
      logger.warn(`Ignoring redundant work item`, this.queue.length, key)
    else {
      this.byKey.set(key, callback)
      this.queue.push(key)
      logger.debug(`Scheduling work item`, this.queue.length, key)
      this.perhapsStart()
    }
  }

  _doWork(myTimerNumber) {
    if(this.queue.length > 0) { // This should almost always be true, but safety first
      const key = this.queue.shift()
      const cb = this.byKey.get(key)
      this.byKey.delete(key)

      try {
        logger.debug(`Running work item`, key, this.queue.length)
        cb()
        logger.debug(`Finished work item`, key, this.queue.length)
      }
      catch(ex) {
        logger.error(`Exception in work item`, key, ex)
        exceptionReport("WorkItem exception", ex)
      }
    }

    // If our job was abandoned, we assume someone else will handle restarting
    if(myTimerNumber != this.curTimerNumber)
      logger.error('Finished an abandoned item', this.queue.length)
    else if(this.queue.length > 0) { // There is more work, schedule it
      logger.debug('Restarting timer')
      this._start()
    } else {
      logger.debug('No more work, stopping timer')
      this.timeout = null
    }
  }

  // Force starting a task
  _start() {
    const self = this

    this.curTimerNumber += 1
    const myTimerNum = this.curTimerNumber
    function helper() {
      self._doWork(myTimerNum)
    }
    this.startTime = new Date()
    this.timeout = Meteor.setTimeout(helper, self.delay)
  }

  perhapsStart() {
    const ONE_MINUTE = 60 * 1000

    if(this.queue.length > 0) {
       if(!this.timeout) {
         logger.debug('prime the pump') // No work is already running
         this._start()
       } else if(((new Date) - this.startTime) > 10 * ONE_MINUTE) {
         // Experiment to see if reddit just gets jammed on a request occasionally
         logger.error(`ABANDONING work item`, this.queue.length)
         this._start()
       }
    }
    else
      logger.debug(`Not starting timer`, this.queue.length)
  }
}
