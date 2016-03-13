

// From https://github.com/monperrus/crawler-user-agents
const uadata = JSON.parse(Assets.getText("crawler-user-agents.json"))

const uaregex = new RegExp(_.reduce(uadata.map(u => u.pattern), (prev, cur) => {
    const newterm = ".*" + cur + ".*"
    if(!prev)
      return newterm // Initial string doesn't need an or
    else
      return prev + "|" + newterm
  }, null), "i") // Important to ignore case

/**
 Return @true if we think this UA is a bot
 */
isBot = function(user_agent) {
  // logger.debug(`Got UA data, regex is ${uaregex}`)

  if(!user_agent)
    return false
  else {
    const res = user_agent.match(uaregex)
    logger.trace(`UA ${user_agent} isBot=${res}`)
    return res
  }
}
