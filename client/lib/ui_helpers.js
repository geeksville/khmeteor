/** Allows:
{{#if eq 1 2}}
They are equal.
{{else}}
They're not equal
{{/if}}
*/
UI.registerHelper('neq', (v1, v2) => {
  return (v1 !== v2)
})
UI.registerHelper('eq', (v1, v2) => (v1 === v2))
UI.registerHelper('and', (v1, v2, options) => (v1 && v2))
UI.registerHelper('or', (v1, v2) => (v1 || v2))
UI.registerHelper('not', (v1) => (!v1))

// Return a nice true or false based on truthiess
UI.registerHelper('toBool', (v1) => (!!v1))

UI.registerHelper('session', (input) => Session.get(input))

/**
 Useful to easily find one object from the named collection, id is optional */
UI.registerHelper('findOne', (collectionName, id = null) => {
  logger.debug('findOne', collectionName, id)
  const query = id ? {
    _id: id
  } : {}
  return window[collectionName].findOne(query)
})

/**
 Find multiple objects in a collection */
UI.registerHelper('find', (collectionName) => {
  logger.debug('find', collectionName)
  return window[collectionName].find()
})

let oldId = 0
  /** generate a unique string which can be used as an ID */
UI.registerHelper('uniqueId', () => {
  oldId += 1
  return "uniqueId" + oldId
})

UI.registerHelper('getParam', (paramName) => getFlowParam(paramName))

UI.registerHelper('startsWith', (str, prefix) => str.startsWith(prefix))

UI.registerHelper('meteorUser', Meteor.user)

currentUrl = function () {
  const path = FlowRouter.current().path
  return Meteor.absoluteUrl(path.substring(1)) // skip the leading slash
}

UI.registerHelper('currentUrl', currentUrl)

// Return bootstrap style 'active' css labels based on route name -
// useful for setting navbar highlight correctly
UI.registerHelper('activeByRoute', (...names) => {
  const routeName = FlowRouter.getRouteName()
  logger.trace("Current route name is: ", routeName)

  return (names.indexOf(routeName) >= 0) ? {
    class: "active"
  } : {}
})

// Return bootstrap style 'active' css labels based on path name -
// useful for setting navbar highlight correctly
UI.registerHelper('activeByPath', (...names) => {
  const path = FlowRouter.current().path
  logger.debug("Current path is: ", path)

  return (names.find(n => path.startsWith(n))) ? {
    class: "active"
  } : {}
})

// FIXME - it seems that sometimes early on params will come back as undefined
// but they actually are defined in .current()
getFlowParam = function (paramName) {
  let v = FlowRouter.getParam(paramName)
  if (!v) {
    const c = FlowRouter.current()
    v = c.params[paramName]
    if (v)
      logger.warn("param not found, fixed", paramName, v)
  }

  return v
}

// Return bootstrap style 'active' css labels based on parameter value -
// useful for setting navbar highlight correctly
UI.registerHelper('activeByParam', (paramName, ...names) => {
  const path = getFlowParam(paramName)
  logger.trace("Param is: ", path)

  // Param not found
  if (!path)
    return {}

  return (names.find(n => path.startsWith(n))) ? {
    class: "active"
  } : {}
})