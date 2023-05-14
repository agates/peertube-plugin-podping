import type { RegisterServerOptions, Video, VideoChannel } from '@peertube/peertube-types'

async function register ({ peertubeHelpers, registerHook }: RegisterServerOptions): Promise<void> {
  peertubeHelpers.logger.info('Hello Podping')

  registerHook({
    target: 'action:api.video.uploaded',
    handler: (video: Video, _req: Express.Request, _res: Express.Response) => {
      peertubeHelpers.logger.info(`Podping: video uploaded with id: ${video.id}`)
    }
  })

  registerHook({
    target: 'action:api.video.updated',
    handler: (video: Video, _req: Express.Request, _res: Express.Response) => {
      peertubeHelpers.logger.info(`Podping: video updated with id: ${video.id}`)
    }
  })

  registerHook({
    target: 'action:api.video.deleted',
    handler: (video: Video, _req: Express.Request, _res: Express.Response) => {
      peertubeHelpers.logger.info(`Podping: video deleted with id: ${video.id}`)
    }
  })

  registerHook({
    target: 'action:api.video-channel.updated',
    handler: (videoChannel: VideoChannel, _req: Express.Request, _res: Express.Response) => {
      peertubeHelpers.logger.info(`Podping: video channel updated with id: ${videoChannel.id}`)
    }
  })
}

async function unregister (): Promise<void> {}

module.exports = {
  register,
  unregister
}
