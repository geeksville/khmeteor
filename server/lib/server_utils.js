
const fs = Npm.require('fs') // Keep here to avoid running on client


inDevelopment = function() {
  return Meteor.settings.public.mode === "development"
}

/**
Writes obj to the private json datafile directory in the project...
*/
writeServerFile = function(directory, filename, obj) {

  const dir = `${process.env.PWD}/${directory}`
  const fullname = `${dir}/${filename}`
  logger.debug('writing to', fullname)

  if(!fs.existsSync(dir))
    fs.mkdirSync(dir)

  fs.writeFileSync(fullname,
    JSON.stringify(obj, null, 1))
}


writeDebugFile = function(corpus, datafiletype, data) {
  // write files for debugging
  const subreddit = corpusToFilename(corpus)
  if(inDevelopment())
    try {
      writeServerFile(`tests/datacache/${datafiletype}`, `${subreddit}.json`, data)
    }
    catch(ex) {
      logger.error(`Ignoring error writing debug file for ${subreddit}`, ex)
    }
  else {
    logger.trace('In production... not writing debug files.')
  }
}
