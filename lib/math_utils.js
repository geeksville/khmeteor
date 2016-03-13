

average = function (arr) { return arr.reduce((a, b) => a + b, 0.0) / arr.length }



/** deviation wrt to mean */
stddev = function (arr) {
  function sqDiffs(arr) {
    return arr.map(v => {
      const d = v - avg
      return d * d
    })
  }

  const avg = average(arr)
  return Math.sqrt(average(sqDiffs(arr)))
}

median = function (arr) {
  if(arr.length < 1)
    return NaN

  const sorted = arr.sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted[middle]
}

// linear interpolate
linearInterpolate = function (x, x0, x1, y0, y1) {

  // If the input range has zero width, just assume middle of output range
  if(x1 == x0)
    return (y0 + y1) / 2

  const s = y0 + (y1 - y0) *
    (x - x0) / (x1 - x0)

  return s
}
