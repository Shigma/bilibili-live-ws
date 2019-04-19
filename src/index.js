const WebSocket = require('ws')

const { encoder, decoder } = require('./buffer')

class LiveWS extends WebSocket {
  constructor(roomid) {
    super('wss://broadcastlv.chat.bilibili.com/sub')
    this.roomid = roomid
    this.online = 0

    this.on('open', () => {
      let buf = encoder({ type: 'join', body: { uid: 0, roomid, protover: 2, platform: 'web', clientver: '1.6.3', type: 2 } })
      this.send(buf)
    })

    this.on('message', async buffer => {
      let packs = await decoder(buffer)
      for (let i = 0; i < packs.length; i++) {
        if (packs[i].type === 'welcome') {
          this.live = true
          this.emit('live')
          this.send(encoder({ type: 'heartbeat' }))
        }
        if (packs[i].type === 'heartbeat') {
          this.online = packs[i].data
          clearTimeout(this.timeout)
          this.timeout = setTimeout(() => this.heartbeat(), 1000 * 30)
          this.emit('heartbeat', this.online)
        }
        if (packs[i].type === 'message') {
          this.emit('msg', packs[i].data)
          this.emit(packs[i].data.cmd, packs[i].data)
        }
      }
    })
  }
  close() {
    clearTimeout(this.timeout)
    super.close()
  }
  heartbeat() {
    this.send(encoder({ type: 'heartbeat' }))
  }
}

module.exports = LiveWS