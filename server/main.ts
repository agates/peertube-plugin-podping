import type {
  MVideoFullLight,
  PeerTubeHelpers,
  PluginSettingsManager,
  RegisterServerOptions,
  VideoChannel
} from '@peertube/peertube-types'
import type { CustomTag } from '@peertube/feed/lib/typings'
import { VideoState } from '@peertube/peertube-types'

// eslint-disable-next-line no-new-func,@typescript-eslint/no-implied-eval
const importDynamic = new Function('modulePath', 'return import(modulePath)')

const fetch = async (...args: any[]): Promise<any> => {
  const module = await importDynamic('node-fetch')
  return module.default(...args)
}

const PODPING_CLOUD_HOST = 'podping.cloud'

async function getSettingPodpingCloudApiKey (settingsManager: PluginSettingsManager): Promise<string> {
  const apiKeySetting = await settingsManager.getSetting('podping.cloud-api-key')

  if (!apiKeySetting) {
    throw new Error('Podping: Podping.cloud API key is not defined')
  }

  return apiKeySetting.toString()
}

function getPodpingCloudUrl (feedUrl: string, reason: string, medium: string): string {
  return `https://${PODPING_CLOUD_HOST}/?url=${encodeURI(feedUrl)}&reason=${reason}&medium=${medium}`
}

function getPodcastFeedPath (videoChannelId: number): string {
  return `/feeds/podcast/videos.xml?videoChannelId=${videoChannelId}`
}

function getPodcastFeedUrl (webserverUrl: string, videoChannelId: number): string {
  return webserverUrl + getPodcastFeedPath(videoChannelId)
}

async function pingPodpingCloud (
  peertubeHelpers: PeerTubeHelpers,
  videoChannelId: number,
  reason: string,
  medium: string,
  apiKey: string
): Promise<void> {
  const webserverUrl = peertubeHelpers.config.getWebserverUrl()
  const feedUrl = getPodcastFeedUrl(webserverUrl, videoChannelId)
  peertubeHelpers.logger.info(`Podping - feedUrl: ${feedUrl}`)
  const podpingCloudUrl = getPodpingCloudUrl(feedUrl, reason, medium)
  peertubeHelpers.logger.info(`Podping - podpingCloudUrl: ${podpingCloudUrl}`)

  return fetch(podpingCloudUrl, {
    method: 'GET',
    headers: { Authorization: apiKey }
  }).then(async response => {
    const responseText: string = await response.text()
    if (response.ok) {
      return responseText
    }
    throw new Error(`Podping - podping.cloud response: ${responseText}`)
  }).then((data: string) => {
    peertubeHelpers.logger.info(`Podping - podping.cloud response: ${data}`)
  })
}

async function register (
  { peertubeHelpers, registerHook, registerSetting, settingsManager }: RegisterServerOptions
): Promise<void> {
  peertubeHelpers.logger.info('Podping: registering')

  registerSetting({
    name: 'podping.cloud-api-key',
    label: 'Podping.cloud API Key',
    type: 'input-password',
    descriptionHTML: 'This is your API key for Podping.cloud.  ' +
      'Email <a href="mailto:podping@podcastindex.org">podping@podcastindex.org</a> ' +
      'with your instance details to acquire one.',
    private: true
  })

  registerHook({
    // @ts-expect-error Type doesn't exist for peertube 5.1 yet
    target: 'action:live.video.state.updated',
    handler: async ({ video }: { video: MVideoFullLight }) => {
      const apiKey = await getSettingPodpingCloudApiKey(settingsManager)

      if (video.id === undefined) {
        throw new Error('Podping: video live state updated with undefined id')
      }

      const videoId: number = video.id

      peertubeHelpers.logger.info(
        `Podping: video live state updated with id: ${videoId} - channel id: ${video.channelId}`
      )

      const reason = video.state === VideoState.PUBLISHED ? 'live' : 'liveEnd'
      await pingPodpingCloud(peertubeHelpers, video.channelId, reason, 'video', apiKey)
    }
  })

  registerHook({
    target: 'action:api.video.uploaded',
    handler: async ({ video }: { video: MVideoFullLight }) => {
      const apiKey = await getSettingPodpingCloudApiKey(settingsManager)

      if (video.id === undefined) {
        throw new Error('Podping: video uploaded with undefined id')
      }

      const videoId: number = video.id

      peertubeHelpers.logger.info(`Podping: video uploaded with id: ${videoId} - channel id: ${video.channelId}`)

      await pingPodpingCloud(peertubeHelpers, video.channelId, 'update', 'video', apiKey)
    }
  })

  registerHook({
    target: 'action:api.video.updated',
    handler: async ({ video }: { video: MVideoFullLight }) => {
      const apiKey = await getSettingPodpingCloudApiKey(settingsManager)

      if (video.id === undefined) {
        throw new Error('Podping: video updated with undefined id')
      }

      const videoId: number = video.id

      peertubeHelpers.logger.info(`Podping: video updated with id: ${videoId} - channel id: ${video.channelId}`)

      await pingPodpingCloud(peertubeHelpers, video.channelId, 'update', 'video', apiKey)
    }
  })

  registerHook({
    target: 'action:api.video.deleted',
    handler: async ({ video }: { video: MVideoFullLight }) => {
      const apiKey = await getSettingPodpingCloudApiKey(settingsManager)

      peertubeHelpers.logger.info(`Podping: video deleted with channel id: ${video.channelId}`)

      await pingPodpingCloud(peertubeHelpers, video.channelId, 'update', 'video', apiKey)
    }
  })

  registerHook({
    target: 'action:api.video-channel.updated',
    handler: async ({ videoChannel }: { videoChannel: VideoChannel }) => {
      const apiKey = await getSettingPodpingCloudApiKey(settingsManager)

      if (videoChannel.id === undefined) {
        throw new Error('Podping: video channel updated with undefined id')
      }

      peertubeHelpers.logger.info(`Podping: video channel updated with id: ${videoChannel.id}`)

      await pingPodpingCloud(peertubeHelpers, videoChannel.id, 'update', 'video', apiKey)
    }
  })

  registerHook({
    // @ts-expect-error Type doesn't exist for peertube 5.1 yet
    target: 'filter:feed.podcast.channel.create-custom-tags.result',
    handler: (result: CustomTag[]) => {
      return result.concat([
        {
          name: 'podcast:podping',
          attributes: { usesPodping: 'true' }
        }
      ])
    }
  })
}

async function unregister (): Promise<void> {}

module.exports = {
  register,
  unregister
}
