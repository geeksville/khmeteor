const Snoocore = Meteor.npmRequire('snoocore')

function dumpLink(l) {
  logger.debug(`${l.name}: ${l.title}`)
}

function throwRedditException(status, message) {
  throw new Meteor.Error(status, 'Reddit error response ' + status, message)
}

/**
 top level page requests come back as a listing object, but for comments
 we are given an array of listing objects.  merge them all...

 returns an array of listing objects
*/
function flattenListing(l) {
  if(l instanceof Array) {
    const arrays = l.map( c => flattenListing(c) )

    // Now flatten those arrays into one single array
    return _.flatten(arrays)
  }
  else {
    // Reddit might return null here
    return (l && l.data && l.data.children) ? l.data.children : [] // Listings as an array of { kind, data }
  }
}

RedditClient = class RedditClient {
  constructor(accessToken) {
    this.base = "/"
    this.connectToReddit()
  }

  connectToReddit() {
    const auth = JSON.parse(Assets.getText("reddit_auth_secret.json"))
    this.reddit = new Snoocore({
      userAgent: '/u/punkgeek fixme@0.1.0',
      throttle: 0, // Go as fast as reddit will let us...
      retryAttempts: 0, // default is 60, but we want to error out early so we can try something different
      requestTimeout: 20000, // 20 secs
      oauth: {
        // See https://snoocore.readme.io/docs/oauth-application-only
        type: 'script',
        key: auth.key,
        secret: auth.secret,
        username: auth.username,
        password: auth.password,
        //duration: 'permanent', // defaults to 'temporary'
        scope: [ 'read', 'history' ] // history needed to read user cmts
        // Does not have a deviceId!
      }
    })
  }

  /** subreddit can be null, /r/tifu or /u/punkgeek */
  query(path, subreddit = null, options = {}) {

    if(typeof subreddit == "undefined")
      throw new Meteor.Error(500, 'Error 500: We used undefined subreddit')

    // If someone asks for /r/reddit, instead go to the base of the tree
    // really old comments might reference reddit.com as the subreddit
    if(subreddit === "/r/reddit" || subreddit === "/r/reddit.com")
      subreddit = null

    var redditprefix
    if(subreddit == null)
      redditprefix = ''
    else if(subreddit.startsWith("/r/"))
      redditprefix = subreddit.substring(1)
    else if(subreddit.startsWith("/u/"))
      redditprefix = "user/" + subreddit.substring(3)
    else
      throw new Meteor.Error(404, 'Error 404: Invalid name ' + subreddit, 'must be /r or /u')

    const fullpath = this.base + redditprefix + "/" + path

    logger.trace(`calling reddit ${fullpath}`)

    // const options = {} // { limit: 100 }
    const callContextOptions = {} // { bypassAuth: true }

    let retriesRemaining = 1

    // wrapper to conver reddit api to a sync api - returns data object
    callReddit = () => {
      return Async.runSync((done) => {
        const promise = this.reddit(fullpath).get(options, callContextOptions)
        promise.then((res) => {
          //logger.debug(`got reddit result ${objToStr(res)}`)
          done(null, res)
        }).catch((error) => {
          done(error, null)
        })
      })
    }

    while(true) {
      const data = callReddit()

      if(data.error) {
        if(data.error.status = 401) {
          if(retriesRemaining) {
            retriesRemaining -= 1
            logger.error("Reddit returned unauthorized - FIXME, reconnecting", fullpath)
            this.connectToReddit()
            continue // Try again (instead of returning)
          }
          else {
            logger.error("Reddit returned unauthorized - out of retries!", fullpath, data.error)
          }
        }
        else if(data.error.status = 403)
          logger.warn("Reddit returned forbidden", fullpath)
        else if(data.error.status = 404)
          logger.warn("Reddit returned not found", fullpath)
        else if(data.error.status = 503)
          logger.warn("Reddit returned svc unavailable", fullpath)
        else
          logger.error("Reddit returned unexpected error", fullpath, data.error)

        throwRedditException(data.error.status, data.error.message)
      }

      //logger.debug(`reddit results ${data}`)
      return data.result
    }
  }

  getListings(path, subreddit, kind = null, options = {}) {
    const qres = this.query(path, subreddit, options = options)
    // FIXME - support paging through listings eventually

    let listings = flattenListing(qres)
    if(kind != null)
      listings = _.filter(listings, l => l.kind == kind)

    return listings
  }


  /**
   Used for reading lists of top level reddit posts

   returns an array of t3/link record
  */
  getLinks(path, subreddit, options = {}) {
    logger.trace(`Asking reddit for ${subreddit}`)

    const listings = this.getListings(path, subreddit, kind = null, options = options)

    if(!listings.length) {
      logger.error(`Error, empty link list`, subreddit)
      throw new Meteor.Error(404, 'Error 404: Subreddit Not found', 'empty listings')
    }

    // FIXME - confirm that all types are t3
    const res = listings.map( l => {
      const lres = l.data

      // Preextract the article id to make usage by others easier (remove t3_)
      lres.article = lres.name.substr(3)
      return lres
    })

    //_.each(res, dumpLink)
    return res
  }

  /**
  Given a link object, return the comments for that object
  */
  linkToComments(link, options = {}) {
    const res = this.getFlattenedComments(subredditToCorpus(link.subreddit), link.article, options)
    return res
  }

  getHot(subreddit, options = {}) {
    return this.getLinks("hot", subreddit, options = options)
  }

  /** looks like:
  2015-11-26 10:18:50.780 info:  [default]  read { kind: 't5',
I20151126-10:18:50.782(-10)?   data:
I20151126-10:18:50.782(-10)?    { banner_img: '',
I20151126-10:18:50.783(-10)?      submit_text_html: '&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;ul&gt;\n&lt;li&gt;&lt;p&gt;&lt;strong&gt;Please keep within the spirit of rage comics, memes, gifs, etc.&lt;/strong&gt; Personal images can be posted in &lt;a href="/r/TwoXChromosomes"&gt;/r/TwoXChromosomes&lt;/a&gt; during Image-Fest Friday.&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;Be respectful of others.&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;No posts about other subreddits, threads, or users.&lt;/p&gt;&lt;/li&gt;\n&lt;li&gt;&lt;p&gt;Use the [NSFW] tag when appropriate.&lt;/p&gt;&lt;/li&gt;\n&lt;/ul&gt;\n&lt;/div&gt;&lt;!-- SC_ON --&gt;',
I20151126-10:18:50.783(-10)?      user_is_banned: null,
I20151126-10:18:50.783(-10)?      id: '2sekm',
I20151126-10:18:50.784(-10)?      user_is_contributor: null,
I20151126-10:18:50.784(-10)?      submit_text: '* **Please keep within the spirit of rage comics, memes, gifs, etc.** Personal images can be posted in /r/TwoXChromosomes during Image-Fest Friday.\n\n* Be respectful of others.\n\n* No posts about other subreddits, threads, or users.\n\n* Use the [NSFW] tag when appropriate.',
I20151126-10:18:50.784(-10)?      display_name: 'TrollXChromosomes',
I20151126-10:18:50.784(-10)?      header_img: 'http://a.thumbs.redditmedia.com/hSlX3r7SW6kx_hPZ.png',
I20151126-10:18:50.784(-10)?      description_html: '&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;h3&gt;Come for the period comics. Stay for the cultural awareness.&lt;/h3&gt;\n\n&lt;hr/&gt;\n\n&lt;ul&gt;\n&lt;li&gt;&lt;strong&gt;Please be respectful of others.&lt;/strong&gt;&lt;/li&gt;\n&lt;li&gt;&lt;strong&gt;No posts about other subreddits, threads, or users.&lt;/strong&gt;&lt;/li&gt;\n&lt;li&gt;&lt;strong&gt;Use the [NSFW] tag when appropriate.&lt;/strong&gt;&lt;/li&gt;\n&lt;li&gt;&lt;strong&gt;Save personal images for Image-Fest Friday on TwoX.&lt;/strong&gt;&lt;/li&gt;\n&lt;/ul&gt;\n\n&lt;hr/&gt;\n\n&lt;p&gt;&lt;strong&gt;related subreddits&lt;/strong&gt;&lt;/p&gt;\n\n&lt;table&gt;&lt;thead&gt;\n&lt;tr&gt;\n&lt;th align="left"&gt;&lt;/th&gt;\n&lt;th align="left"&gt;&lt;/th&gt;\n&lt;/tr&gt;\n&lt;/thead&gt;&lt;tbody&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/AskTrollX"&gt;/r/AskTrollX&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/Troll4Troll"&gt;/r/Troll4Troll&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollMedia"&gt;/r/TrollMedia&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollCooking"&gt;/r/TrollCooking&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/Trollfitness"&gt;/r/Trollfitness&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/CraftyTrolls"&gt;/r/CraftyTrolls&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollBookClub"&gt;/r/TrollBookClub&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollXGirlGamers"&gt;/r/TrollXGirlGamers&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollGamers"&gt;/r/TrollGamers&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollDepression"&gt;/r/TrollDepression&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollMUA"&gt;/r/TrollMUA&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollXWeddings"&gt;/r/TrollXWeddings&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollMeta"&gt;/r/TrollMeta&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/trollxporn"&gt;/r/trollxporn&lt;/a&gt; [nsfw]&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollFart"&gt;/r/TrollFart&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/Trollchromosomes"&gt;/r/Trollchromosomes&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollYChromosome"&gt;/r/TrollYChromosome&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/AskTrollY"&gt;/r/AskTrollY&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;tr&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollXSupport"&gt;/r/TrollXSupport&lt;/a&gt;&lt;/td&gt;\n&lt;td align="left"&gt;&lt;a href="/r/TrollXMoms"&gt;/r/TrollXMoms&lt;/a&gt;&lt;/td&gt;\n&lt;/tr&gt;\n&lt;/tbody&gt;&lt;/table&gt;\n\n&lt;p&gt;&lt;strong&gt;&lt;a href="http://www.reddit.com/user/sodypop/m/trollnetwork"&gt;View the troll network of subreddits&lt;/a&gt;&lt;/strong&gt;&lt;/p&gt;\n\n&lt;p&gt;&lt;strong&gt;IRC: &lt;a href="https://kiwiirc.com/client/irc.snoonet.org/?nick=troll%7C?#TrollChromosomes"&gt;#TrollChromosomes on snoonet.org&lt;/a&gt;&lt;/strong&gt;&lt;/p&gt;\n\n&lt;h5&gt;&lt;a href="https://un.reddit.com/r/TrollXChromosomes" title="enable the unicorn cursor"&gt;enable the unicorn cursor&lt;/a&gt;&lt;/h5&gt;\n&lt;/div&gt;&lt;!-- SC_ON --&gt;',
I20151126-10:18:50.785(-10)?      title: 'TrollXChromosomes',
I20151126-10:18:50.785(-10)?      collapse_deleted_comments: false,
I20151126-10:18:50.785(-10)?      public_description: '### A subreddit for rage comics and other memes with a girly slant. ',
I20151126-10:18:50.785(-10)?      over18: false,
I20151126-10:18:50.785(-10)?      public_description_html: '&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;h3&gt;A subreddit for rage comics and other memes with a girly slant.&lt;/h3&gt;\n&lt;/div&gt;&lt;!-- SC_ON --&gt;',
I20151126-10:18:50.787(-10)?      community_rules: [],
I20151126-10:18:50.788(-10)?      icon_size: null,
I20151126-10:18:50.788(-10)?      suggested_comment_sort: null,
I20151126-10:18:50.788(-10)?      icon_img: '',
I20151126-10:18:50.788(-10)?      header_title: 'We are the nyanty-nyan percent!',
I20151126-10:18:50.789(-10)?      description: '### Come for the period comics. Stay for the cultural awareness.\n---\n\n* **Please be respectful of others.**\n* **No posts about other subreddits, threads, or users.**\n* **Use the [NSFW] tag when appropriate.**\n* **Save personal images for Image-Fest Friday on TwoX.**\n\n---\n\n**related subreddits**\n\n|||\n:--|:--\n/r/AskTrollX | /r/Troll4Troll \n/r/TrollMedia | /r/TrollCooking | cooking with Trolls\n/r/Trollfitness | /r/CraftyTrolls\n/r/TrollBookClub | /r/TrollXGirlGamers\n/r/TrollGamers | /r/TrollDepression\n/r/TrollMUA | /r/TrollXWeddings | /r/TrollXMeetups\n/r/TrollMeta | /r/trollxporn [nsfw]\n/r/TrollFart | /r/Trollchromosomes\n/r/TrollYChromosome | /r/AskTrollY\n/r/TrollXSupport | /r/TrollXMoms\n\n**[View the troll network of subreddits](http://www.reddit.com/user/sodypop/m/trollnetwork)**\n\n**IRC: [\\#TrollChromosomes on snoonet.org](https://kiwiirc.com/client/irc.snoonet.org/?nick=troll%7C?#TrollChromosomes)**\n\n#####[enable the unicorn cursor](https://un.reddit.com/r/TrollXChromosomes "enable the unicorn cursor")',
I20151126-10:18:50.789(-10)?      user_is_muted: null,
I20151126-10:18:50.790(-10)?      submit_link_label: null,
I20151126-10:18:50.790(-10)?      accounts_active: 595,
I20151126-10:18:50.790(-10)?      public_traffic: true,
I20151126-10:18:50.790(-10)?      header_size: [ 122, 46 ],
I20151126-10:18:50.791(-10)?      subscribers: 178518,
I20151126-10:18:50.791(-10)?      submit_text_label: null,
I20151126-10:18:50.791(-10)?      lang: 'en',
I20151126-10:18:50.791(-10)?      name: 't5_2sekm',
I20151126-10:18:50.792(-10)?      created: 1301573353,
I20151126-10:18:50.792(-10)?      url: '/r/TrollXChromosomes/',
I20151126-10:18:50.793(-10)?      quarantine: false,
I20151126-10:18:50.793(-10)?      hide_ads: false,
I20151126-10:18:50.804(-10)?      created_utc: 1301544553,
I20151126-10:18:50.805(-10)?      banner_size: null,
I20151126-10:18:50.805(-10)?      user_is_moderator: null,
I20151126-10:18:50.805(-10)?      user_sr_theme_enabled: true,
I20151126-10:18:50.805(-10)?      comment_score_hide_mins: 0,
I20151126-10:18:50.805(-10)?      subreddit_type: 'public',
I20151126-10:18:50.805(-10)?      submission_type: 'link',
I20151126-10:18:50.806(-10)?      user_is_subscriber: null } }

  */
  getAbout(subreddit, options = {}) {
    const res = this.query("about", subreddit, options = options)

    if(!res || !res.data || !res.data.id) {
     logger.error(`Error, empty data for ${subreddit} about`)
     throw new Meteor.Error(404, 'Error 404: Subreddit Not found', 'that subreddit/about does not exist')
    }

    return res
  }

  getMe() { return this.query("api/v1/me") }

  /**
  Return a flat listing of only the comment results (and discard any tree heirarchy)
  */
  getFlattenedComments(subreddit, article, options = {}) {
    return this.getListings(`comments/${article}`, subreddit, kind = "t1", options = options).map(l => l.data)
  }

  /**
   a comment looks like:

   comment { subreddit_id: 't5_2qh1a',
I20151208-17:19:16.996(-8)?   link_title: 'but... i\'m on linux.  however, i do wonder how many people actually fall for this.',
I20151208-17:19:16.996(-8)?   banned_by: null,
I20151208-17:19:16.996(-8)?   removal_reason: null,
I20151208-17:19:16.996(-8)?   link_id: 't3_8m1cs',
I20151208-17:19:16.996(-8)?   link_author: 'dark_im4g3',
I20151208-17:19:16.997(-8)?   likes: null,
I20151208-17:19:16.997(-8)?   replies: '',
I20151208-17:19:16.997(-8)?   user_reports: [],
I20151208-17:19:16.997(-8)?   saved: false,
I20151208-17:19:16.997(-8)?   id: 'c09puoh',
I20151208-17:19:16.997(-8)?   gilded: 0,
I20151208-17:19:16.997(-8)?   archived: true,
I20151208-17:19:16.997(-8)?   report_reasons: null,
I20151208-17:19:16.998(-8)?   author: 'punkgeek',
I20151208-17:19:16.998(-8)?   parent_id: 't1_c09pu7w',
I20151208-17:19:16.998(-8)?   score: 53,
I20151208-17:19:16.998(-8)?   approved_by: null,
I20151208-17:19:16.998(-8)?   over_18: false,
I20151208-17:19:16.998(-8)?   controversiality: 0,
I20151208-17:19:16.998(-8)?   body: 'Mine is 127.0.0.1 - I fuckin\' dare ya.',
I20151208-17:19:16.999(-8)?   edited: false,
I20151208-17:19:16.999(-8)?   author_flair_css_class: null,
I20151208-17:19:16.999(-8)?   downs: 0,
I20151208-17:19:16.999(-8)?   body_html: '&lt;div class="md"&gt;&lt;p&gt;Mine is 127.0.0.1 - I fuckin&amp;#39; dare ya.&lt;/p&gt;\n&lt;/div&gt;',
I20151208-17:19:16.999(-8)?   quarantine: false,
I20151208-17:19:16.999(-8)?   subreddit: 'linux',
I20151208-17:19:16.999(-8)?   score_hidden: false,
I20151208-17:19:17.000(-8)?   name: 't1_c09puoh',
I20151208-17:19:17.000(-8)?   created: 1242908749,
I20151208-17:19:17.000(-8)?   author_flair_text: null,
I20151208-17:19:17.000(-8)?   link_url: 'http://imgur.com/e9edg.png',
I20151208-17:19:17.000(-8)?   created_utc: 1242879949,
I20151208-17:19:17.000(-8)?   ups: 53,
I20151208-17:19:17.000(-8)?   mod_reports: [],
I20151208-17:19:17.001(-8)?   num_reports: null,
I20151208-17:19:17.001(-8)?   distinguished: null }
  */
  getUserComments(username, sort = "new") {
    return this.getListings(`comments`,
      subreddit = username, kind = null, options = { sort: sort }).map(l => l.data)
  }
}
