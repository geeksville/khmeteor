/**
 Return a random alphanumeric string
 */
randomString = function (length) {
  return Math.random().toString(36).substring(length)
}

capitalizeFirstLetter = function (string) {
  if (string.length > 0)
    return string.charAt(0).toUpperCase() + string.slice(1)
  else
    return ""
}