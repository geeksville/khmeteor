/**
Given an object and the name of a method that returns other objects,
async wrap the methods of any objects it returns.  (You'll still need to wrap the top level method yourself)
*/
asyncMetaWrap = function (obj, methodName, childMethodNames) {
  const oldMethod = obj[methodName]
    // logger.debug('wrapping', methodName, oldMethod)
  obj[methodName] = function (options, callback) {
    oldMethod(options, function (err, data) {
      if (data)
        data.forEach(r => {
          childMethodNames.forEach(method => {
            r[method] = Async.wrap(r, method)
          })
        })
      callback(err, data)
    })
  }
}