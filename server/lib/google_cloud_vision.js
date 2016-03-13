GoogleCloudVision = class GoogleCloudVision {
  constructor(apiKey = Meteor.settings.private.google.apiKey) {
    this.apiKey = apiKey

    assert(apiKey)
  }

  queryImage(imageBuffer) {
    const url = "https://vision.googleapis.com/v1/images:annotate"

    const opts = {
      params: {
        key: this.apiKey
      },
      data: {
        // See https://cloud.google.com/vision/reference/rest/v1alpha1/images/annotate#body.request_body.SCHEMA_REPRESENTATION
        requests: [{
          image: {
            content: imageBuffer.toString('base64')
          },
          features: [{
            type: "TEXT_DETECTION",
            maxResults: 100
          }, {
            type: "TYPE_UNSPECIFIED",
            maxResults: 100
          }]
        }]
      }
    }

    const res = HTTP.post(url, opts)

    if (res.statusCode != 200) {
      logger.error("google error", res)
      throw new Error("Image analysis returned error")
    }

    const textStrings = res.data.responses.filter(a => 'textAnnotations' in a)[0].textAnnotations.map(a => a.description)

    logger.debug("google results", res.data.responses, textStrings)

    return textStrings
  }
}