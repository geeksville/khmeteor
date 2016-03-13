
/*
  // From loggly
  logger = Logger

  Logger.debug = function (param, tag) {
    Meteor.call('logglyTrace', param, tag, function() {});
  }
*/

// For pince
const pince = Package["jag:pince"]
pince.Logger.setLevel('debug')
logger = new pince.Logger('default')
