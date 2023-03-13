const uuid = require('uuid')
const {Video, User} = require('../models')
const viewpoitsStore = require('../stores/viewpoitsStore')
const youtubeApi = require('../stores/youtubeApi')
const { getCategoryName } = require('../utils/categories')
const { statuses } = require('../utils/statuses')


const getDuration = (value) => {
    const digits = value.split(/[A-Z]/).filter(str => !!str).reverse().map(item => parseInt(item))
    const letters = value.split(/[0-9]/).filter(str => !!str && str !== 'PT').reverse().map(item => item.toLowerCase())
    const result = 
        (letters.includes('s') ? digits[letters.indexOf('s')] : 0) +
        (letters.includes('m') ? digits[letters.indexOf('m')] : 0) * 60 +
        (letters.includes('h') ? digits[letters.indexOf('h')] : 0) * 60 * 60
    return result
}

async function addUser(user) {
    const userModel = await User.findOne({_id: user.id})
    const statusConfig = statuses[userModel.status][userModel.level]
    viewpoitsStore.addToUserData(user.id, userModel.username, userModel.prp + userModel.rfp, statusConfig.tw, statusConfig.maxViews)
}

async function processPlaylist(videoId, playlistId) {
    let result
    try {
        result = await youtubeApi.fetchPlaylistItems(playlistId)
    } catch { return {error: true, message: 'Invalid playlistID'} }
    if (result.pageInfo.totalResults > 50 || result.pageInfo.totalResults < 5)
        return { error: true, message: 'The number of videos in the playlist must be between 5 and 50' }
    const videoIds = result.items.map((item) => item.contentDetails.videoId)
    if (!videoIds.includes(videoId)) return {error: true, message: 'The video does not exist in this playlist'}
    if (videoIds.indexOf(videoId) === 0 || videoIds.indexOf(videoId) === videoIds.length-1)
        return {error: true, message: 'Video must not be the first or last video in the playlist'}
    const prevVideoId = videoIds[videoIds.indexOf(videoId) - 1]
    const info = await youtubeApi.fetchVideoInfo(prevVideoId)
    return {error: false, duration: getDuration(info.contentDetails.duration), prevVideoId}
}

function mobileCheck(req) {
    const allowedOs = ['windows', 'linux', 'kali', 'macos', 'mac']
    const os = req.useragent.os.toLowerCase().split(' ')[0]
    const isAllowedDevice = req.useragent.isDesktop && !req.useragent.isMobile && allowedOs.includes(os)
    return !isAllowedDevice
}

class VideoController {

    async uploadVideo(req, res, next) {
        const {videoId, playlistId} = req.body
        const user = req.user
        const playlistResponse = await processPlaylist(videoId, playlistId)
        if (playlistResponse.error) return res.status(400).json({message: playlistResponse.message})
        const videoInfo = await youtubeApi.fetchVideoInfo(videoId)
        // if (!videoInfo) return res.status(400).json({message: 'Invalid videoID'})
        const duration = getDuration(videoInfo.contentDetails.duration)
        if (duration < 60 || duration > 60 * 30) return res.status(400).json({message: 'Video duration must be between 1 and 30 min'})
        const url = 'https://www.youtube.com/watch?v=' + videoId
        const category = getCategoryName(videoInfo.snippet.categoryId)
        const video = new Video({name: videoInfo.snippet.title, channelName: videoInfo.snippet.channelTitle,
            userId: user.id, duration,videoId, playlistId, url, active: true, prevDuration: playlistResponse.duration,
            category, photo: videoInfo.snippet.thumbnails.high.url, prevVideoId: playlistResponse.prevVideoId})
        await video.save()
        return res.status(200).json({message: 'Video was upload successfully'})
    }

    async removeVideo(req, res, next) {
        const {videoId} = req.query
        const user = req.user
        await Video.deleteOne({videoId, userId: user.id})
        return res.status(200).json({message: 'Video was deleted'})
    }

    async toggleActive(req, res, next) {
        const {videoId, bool} = req.body
        const user = req.user
        await Video.updateOne({videoId, userId: user.id}, {active: bool})
        return res.status(200).json({message: 'Video was updated'})
    }

    async watched(req, res, next) {
        const {time} = req.body
        const user = req.user
        if (mobileCheck(req)) return res.status(403).json({message: 'Sessions is unavailable for mobile'})
        if (!viewpoitsStore.isActive()) return res.status(200).json({active: false})
        if (!viewpoitsStore.checkUser(user.username)) await addUser(user)
        viewpoitsStore.watchVideo(time, user.username)
        return res.status(200).json({active: true})
    }

    async getWatch(req, res, next) {
        const user = req.user
        if (mobileCheck(req)) return res.status(403).json({message: 'Sessions is unavailable for mobile'})
        if (!viewpoitsStore.isActive()) return res.status(200).json({next: {url: '', duration: 10}})
        const hash = req.fingerprint.hash
        if (!viewpoitsStore.checkHash(hash)) return res.status(400).json({message: 'Not allowed'})
        if (!viewpoitsStore.checkUser(user.username)) await addUser(user)
        if (viewpoitsStore.isWatching(user.username)) return res.status(400).json({message: 'The session is already running'})
        const nextVideo = viewpoitsStore.chooseVideo(user.username, hash)
        if (!nextVideo) return res.status(400).json({message: 'No available videos'})
        return res.status(200).json({next: nextVideo})
    }

    async getVideos(req, res, next) {
        const user = req.user
        let videos = await Video.find({userId: user.id})
        videos.forEach((video, index) => {
            video._doc['inView'] = viewpoitsStore.isInView(video.category, video.videoId)
        })
        return res.status(200).json({videos})
    }

    async getActive(req, res, next) {
        const active = viewpoitsStore.isActive()
        return res.status(200).json({active})
    }

    async getStore(req, res, next) {
        const data = viewpoitsStore.getAll()
        return res.status(200).json(data)
    }

    async getWatchTime(req, res, next) {
        const user = req.user
        const tw = viewpoitsStore.getMinutesWatch(user.username)
        return res.status(200).json({tw})
    }

    async test(req, res, next) {
        // const views = viewpoitsStore.setVideoViews(['NWsXF64LEq0', 'oUh9YdpMQpo'])
        // console.log();
        // const data = await youtubeApi.test()
        // console.log(getDuration('PT4M'))
        const origin = req.header('Origin')
        console.log(origin);
        return res.status(200).send(origin)

    }
}

module.exports = new VideoController()