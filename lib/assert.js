

assert = (test) => {
  if(!test) {
    const err = new Meteor.Error( 500, 'Assertion failure' )

    logger.error("Assertion failure!", err.stack)
    throw err
  }
}
