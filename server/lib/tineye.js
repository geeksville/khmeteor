TinEye = class TinEye {
  constructor(pub_key = 'LCkn,2K7osVwkX95K4Oy', priv_key = '6mm60lsCNIB,FwOWjJqA80QZHh9BMwc-ber4u=t^') {
    const tineye = Meteor.npmRequire('tineye')

    // If no keys provided we will use sandbox keys
    this.api = new tineye(pub_key, priv_key)
    this.search = Meteor.wrapAsync(this.api.search, this.api)
    this.remaining = Meteor.wrapAsync(this.api.remaining, this.api)
    this.count = Meteor.wrapAsync(this.api.count, this.api)
    this.request = Meteor.wrapAsync(this.api.request, this.api)
    this.testUrl = "http://www.tineye.com/images/meloncat.jpg" // For use with sandbox
  }
}