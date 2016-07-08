import './multimap.js'

describe('MultiMap', function () {
  var map

  beforeEach(function () {
    map = new MultiMap()
    map.set('a', 'cat')
    map.set('a', 'fish')
  })

  it('should be able to add multiple', function () {
    expect(map.has('a', 'cat')).to.be.ok
    expect(map.has('b', 'anything')).to.be.false
    expect(Array.from(map.get('a'))).to.have.members(['cat', 'fish'])
  })

  it('should be able to remove', function () {
    expect(map.size).to.equal(2)
    expect(map.delete('a', 'cat')).to.be.ok
    expect(map.size).to.equal(1)
    expect(Array.from(map.get('a'))).to.have.members(['fish'])
    expect(map.delete('a', 'fish')).to.be.ok
    expect(map.size).to.equal(0)
    expect(map.delete('a', 'fish')).to.be.false
    expect(Array.from(map.get('a'))).to.be.empty
  })
})