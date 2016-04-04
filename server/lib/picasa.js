PicasaClient = class PicasaClient {
  constructor() {
    // Use user.services.google.accessToken
    this.api = new Picasa()
    this.getPhotos = Meteor.wrapAsync(this.api.getPhotos, this.api)
    this.getAlbums = Meteor.wrapAsync(this.api.getAlbums, this.api)
    this.postPhoto = Meteor.wrapAsync(this.api.postPhoto, this.api)
    this.deletePhoto = Meteor.wrapAsync(this.api.deletePhoto, this.api)
  }
}

/**

{ url: 'https://picasaweb.google.com/data/feed/api/user/default?alt=json&kind=photo&access_token=ya29.pgL8-hNpM72j3DvjqbAAnxorhd8dexaNQdv1Zts9QKXL3555RQfdkANYtquZ0SoHxnU',
  headers: { 'GData-Version': '2' } }


getPhotos results look like:
2016-03-15 15:52:56.389 info:  [default]  photo { id: '6252027144578156130',
  album_id: '6251971113614653489',
  access: 'private',
  width: '4208',
  height: '3120',
  size: '1351112',
  checksum: '',
  timestamp: '1455663484000', // NOTE: Timestamp is in UTC
  image_version: '28046',
  commenting_enabled: 'true',
  comment_count: 0,
  content:
   { type: 'image/jpeg',
     src: 'https://lh3.googleusercontent.com/-PS2aQJuEBVg/VsOpkDauRmI/AAAAAAAAbY4/yy9i_HDVSg0//IMG_20160216_145804.jpg' },
  title: 'IMG_20160216_145804.jpg',
  summary: '' }


---

photo { id: '5876863173552859345',
  album_id: '',
  access: 'private',
  width: '',
  height: '',
  size: '',
  checksum: '',
  timestamp: '1429307500000',
  image_version: '',
  commenting_enabled: '',
  comment_count: '',
  content: '',
  title: 'N72KH memorial page',
  summary: '' }

*/