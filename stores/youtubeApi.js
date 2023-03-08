const axios = require('axios')
const { googleApiTokens } = require('../utils/googleApiTokens')


class GoogleApiTokens {

    constructor(clientId, clientSecret, refreshToken, authToken, apiKey) {
        this._clientId = clientId
        this._clientSecret = clientSecret
        this._refreshToken = refreshToken
        this._authToken = authToken
        this._apiKey = apiKey
        this._accessToken = ''
    }

    getAccessToken() {
        return this._accessToken
    }

    getApiKey() {
        return this._apiKey
    }

    async refreshAccessToken() {
        const payload = {
            client_id: this._clientId,
            client_secret: this._clientSecret,
            refresh_token: this._refreshToken,
            grant_type: 'refresh_token'
        }
        const res = await axios.post(`https://www.googleapis.com/oauth2/v4/token`, payload)
        this._accessToken = res.data.access_token
    }
}


class GoogleReqService {

    constructor() {
        this._googleApiTokens = googleApiTokens.map((item) => {
            return new GoogleApiTokens(item.clientId, item.clientSecret, item.refreshToken, item.authToken, item.apiKey)
        })
        this._activeIndex = 0
    }

    #changeTokens() {
        this._activeIndex += 1
        if (this._activeIndex >= this._googleApiTokens.length) {
            Error('Quota expired')
        }
    }

    async getReq(url, payload, expired_code=0) {
        if (expired_code >= 3) {
            this.#changeTokens()
            expired_code = 0
        }
        let resolve
        let access_token = this._googleApiTokens[this._activeIndex].getAccessToken()
        let apiKey = this._googleApiTokens[this._activeIndex].getApiKey()
        if (!access_token) {
            await this._googleApiTokens[this._activeIndex].refreshAccessToken()
            return await this.getReq(url, payload, ++expired_code)
        }
        try {
            let options = { headers: { 'Authorization': `Bearer ${access_token}` } }
            resolve = await axios.get(url + `&key=${apiKey}` + `&access_token=${access_token}`, payload, options)
        } catch {
            await this._googleApiTokens[this._activeIndex].refreshAccessToken()
            return await this.getReq(url, payload, ++expired_code)
        }
        return resolve
    }

    async postReq(url, payload) {
        
    }
}


class YoutubeApi {

    constructor() {
        this._googleReq = new GoogleReqService()
    }

    async createPlaylist(title, desc) {
        const payload = {
            "snippet": { "title": title, "description": desc },
            "status": { "privacyStatus": 'public' }
        }
        const resolve = await this._googleReq.postReq('https://www.googleapis.com/youtube/v3/playlists?part=id,snippet,status', payload)
        return resolve.data.id
    }

    async addVideoToPlaylist(playlistId, videoId) {
        const payload = {
            "snippet": {
                "playlistId": playlistId,
                "resourceId": {
                    "kind": "youtube#video", "videoId": videoId
                }
            }
        }
        await this._googleReq.postReq('https://www.googleapis.com/youtube/v3/playlistItems?part=id,snippet', payload)
    }

    async fetchVideoInfo(videoId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status,topicDetails&id=${videoId}`, {})
        return resolve.data.items[0]
    }

    async fetchVideosInfo(videoIds) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status,topicDetails&id=${videoIds.join(',')}`, {})
        return resolve.data.items
    }

    async fetchChannelActivities(channelId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/activities?part=id,snippet,contentDetails&mine=true&maxResults=50`, {})
        return resolve.data
    }

    async fetchChannelInfo(channelId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/channels?part=brandingSettings,contentDetails,snippet,statistics,status,topicDetails&id=${channelId}`, {})
        return resolve.data
    }

    async fetchPlaylistItems(playlistId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}`, {})
        return resolve.data
    }

    async fetchComments(channelId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&textFormat=plainText&channelId=${channelId}`, {})
        return resolve.data
    }

    async fetchSubscriptions(channelId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet,contentDetails,subscriberSnippet&channelId=${channelId}`, {})
        return resolve.data
    }

    async fetchCategories(videoId) {
        const resolve = await this._googleReq.getReq(`https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=${videoId}`, {})
        return resolve.data
    }

    async test() {
        const data = await this.fetchVideoInfo('WIRK_pGdIdA')
        return data
    }

}

module.exports = new YoutubeApi()


// GET https://youtube.googleapis.com/youtube/v3/videos?part=id&id=Ks-_Mh1QhMc&key=[YOUR_API_KEY]

// Authorization: Bearer [YOUR_ACCESS_TOKEN]
// Accept: application/json

// UC6AUVabHQ-loeKKesYysZZA
