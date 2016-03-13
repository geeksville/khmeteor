

MultiMap = class MultiMap {
  constructor() {
    this.map = new Map()
  }

  // Add entry to the multimap
  set(key, value) {
    this.map.set(key, this.get(key).add(value))
  }

  // return (possibly empty) set of values for this key
  get(key) {
    return this.map.get(key) || (new Set())
  }

  has(key, value) {
    assert(key)
    assert(value)
    return this.get(key).has(value)
  }

  // Remove this key/val pair
  delete(key, value) {
    const newvals = this.get(key)
    if(!newvals.delete(value))
     return false // Not found
    else if(newvals.size == 0)
      return this.map.delete(key) // now empty
    else {
      this.map.set(key, newvals)
      return true // success
    }
  }

  /** Return total number of keypairs in this multimap */
  get size() {
    let count = 0
    for(var vals of this.map.values())
      count += vals.size

    return count
  }
}
