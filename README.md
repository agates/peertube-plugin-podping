# PeerTube plugin Podping

This is a plugin for [Podping](https://podping.org), a decentralized notification system for podcasts.

# Why?

In the case of PeerTube, Podping enables any listener to know when a user has uploaded, updated, or deleted a public video and when live streams start and end.  It does so by utilizing the Podcast RSS feed on your video channels, added in PeerTube 5.2.

This will allow your videos to be automatically indexed by sites like the [Podcast Index](https://podcastindex.org), which [Podcast Apps](https://podcastindex.org/apps?appTypes=app) use for searching for content.  Many podcast applications support on-device live stream notifications.  We currently recommend [Podverse](https://github.com/podverse/podverse-rn), as it has the best video support for PeerTube.

## Supported backends

Currently, the only supported backend is the main [Podping.cloud](https://github.com/Podcastindex-org/podping.cloud) service.  We are looking into supporting self-hostable options in the future.

### Podping.cloud

All you need for Podping.cloud is an API key, which you can obtain by emailing your instance details to [podping@podcastindex.org](mailto:podping@podcastindex.org).  Set this API key in the plugin settings.