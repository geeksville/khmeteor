


ProgressPublisher = class ProgressPublisher {
  // collectionName is the name for the 'collection' which will
  // contain our progress object (the client will use this name when creating)
  // their Meteor.Collection object.
  // Our corresponding publisher will be named <colname>-publish.
  constructor(collectionName) {
    const self = this
    this.subscribers = new MultiMap() // A map from idname to the running publisher for that name
    this.collectionName = collectionName

    Meteor.publish(this.collectionName + "-publish", function (idname) {
      const handler = this

      // I think this is guaranteed to be true
      assert(!self.subscribers.has(idname, handler))
      self.subscribers.set(idname, handler) // this is the handler object for this client sub

      // When the client disconnects, unregister
      this.onStop(() => {
        logger.debug(`${self.collectionName} subscription stopped, forgetting`, idname)
        assert(self.subscribers.delete(idname, handler))
      })

      // Provide a default empty progress object
      handler.added(self.collectionName, idname, {})

      // Claim initial record set is complete
      handler.ready()

      logger.debug(`${self.collectionName} subscription started, listening for`, idname)
    })
  }

  // Send an updated progress object to any subscribers that are waiting
  // for this name
  sendProgress(idname, progobj) {
    const pubinst = this.subscribers.get(idname)
    if(pubinst.size == 0)
      logger.warn(`Dropping progress unsubscribed`, idname, progobj)
    else {
      pubinst.forEach(p => {
        logger.debug(`Telling id/progress`, idname, progobj)
        p.changed(this.collectionName, idname, progobj)
      })
    }
  }
}
