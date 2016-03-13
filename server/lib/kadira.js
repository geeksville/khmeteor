"use strict"

if(!!Meteor.settings.private.kadira) {
  Kadira.connect(Meteor.settings.private.kadira.appId, Meteor.settings.private.kadira.appSecret)
  ﻿Kadira.errors.addFilter(Kadira.errorFilters.filterCommonMeteorErrors﻿)

  Kadira.errors.addFilter(function(errorType, message, error) {
    if(exceptionsToIgnore.indexOf(message) >= 0) return false // We expect to throw this a bunch

    // return true to indicate this error is allowed to be tracked
    return true
  })
}
