const { Video } = require("../models")
const { propabilityWheel } = require("../utils/probabilityWheel")
const { timeConvert } = require("../utils/timeConvert")
const youtubeApi = require("./youtubeApi")


const CYCLE_TIME = 1  // hours
const VIDEO_NUMBER = 10
const CHECK_INTERVAL = 1000 * 60 * 1  // secs

const TW_STANDART = 60 * CYCLE_TIME  // mins

const START_VIDEO_TIME = 4  // secs
const EXTRA_TIME = 60 * 2.5  // secs

const MIN_USERS = 150

class ViewpointsStore {

    constructor() {
        this._active = true
        this._userData = {}
        this._names = []
        this._probNames = []
        this._probCategories = []
        this._videos = {}
    }

    getAll() {
        const obj = {
            active: this._active,
            userData: this._userData,
            names: this._names,
            probNames: this._probNames,
            probCategories: this._probCategories,
            videos: this._videos
        }
        return obj
    }

    getMinutesWatch(nickname) {
        const user = this._userData[nickname]
        if (!user) return 0
        return parseInt(Math.round(user.timewatch * TW_STANDART))
    }

    #setActive(expr) {
        this._active = expr
    }

    #makeProbNames() {
        const res = this._names.map((name) => {
            const user = this._userData[name]
            return {name, value: parseInt(Math.round(user.timewatch * user.prPoints))}
        })
        this._probNames = res.slice()
    }
    #makeProbCategories() {
        const names = Object.keys(this._videos)
        const res = names.map((name) => {
            return {name, value: this._videos[name].length}
        })
        this._probCategories = res.slice()
    }

    #getRandomVideo() {
        const nickname = propabilityWheel(this._probNames)
        const videos = this._userData[nickname].videos
        if (!videos.length) return {}
        const video = videos[Math.floor(Math.random()*videos.length)]
        return video
    }

    #fillVideolist(videoCount) {
        let playlist = []
        for (let j = 0; j < videoCount; j++) {
            const video = this.#getRandomVideo()
            if (!!playlist.filter((v) => v.videoId === video.videoId).length) continue
            playlist.push(video)
        }
        return playlist.filter(p => !!Object.keys(p).length)
    }

    // async #setVideoViews(videos, idField, targetField) {
    //     const videoIds = videos.map((video) => video[idField])
    //     const data = await youtubeApi.fetchVideosInfo(videoIds)
    //     const viewCounts = data.map((d) => parseInt(d.statistics.viewCount))
    //     videos.forEach((video, index) => video[targetField] = viewCounts[index])
    //     return videos.slice()
    // }

    #addVideos() {
        const videosCount = this._names.length < MIN_USERS ? this._names.length : VIDEO_NUMBER
        if (!videosCount) return
        let videos = this.#fillVideolist(videosCount)
        // videos = await this.#setVideoViews(videos.slice(), 'videoId', 'views')
        videos.forEach((video) => {
            const category = video.category
            const t = timeConvert(video.prevDur - START_VIDEO_TIME)
            const duration = video.dur + EXTRA_TIME
            const videoObj = {
                id: video.videoId,
                url: `https://www.youtube.com/watch?v=${video.prevVideoId}&list=${video.playlistId}&t=${t}`,
                duration: duration,
                viewsCount: 0,
                // startViews: video.views,
                // currViews: video.views,
                maxViews: video.maxViews
            }
            if (!this._videos[category]) this._videos[category] = [videoObj]
            else this._videos[category].push(videoObj)
        })
    }

    #setNames() {
        const names = Object.keys(this._userData)
        this._names = names.slice()
    }

    async #setUserVideos() {
        for (let i=0; i<this._names.length; i++) {
            const username = this._names[i]
            const id = this._userData[username].id
            const userVideos = await Video.find({userId: id, active: true})
            const videoObjs = userVideos.map((item) => {
                return {videoId: item.videoId, playlistId: item.playlistId, dur: item.duration, prevDur: item.prevDuration,
                    category: item.category.toLowerCase().split(' ')[0], maxViews: this._userData[username].maxViews, prevVideoId: item.prevVideoId}
            }).filter((item) => {
                if (!this._videos[item.category]) return true
                return !this._videos[item.category].filter(v => v.videoId === item.videoId).length
            })
            this._userData[username]['videos'] = videoObjs.slice()
        }
    }

    #clearCache() {
        this._userData = {}
        this._names = []
        this._probNames = []
    }

    #clearVideos() {
        const categories = Object.keys(this._videos)
        categories.forEach((category) => {
            let tempVideos = this._videos[category].slice().filter((video) => {
                return video.viewsCount < video.maxViews * 1.2
            })
            this._videos[category] = tempVideos.slice()
        })
    }

    addToUserData(id, nickname, prPoints, timewatch, maxViews) {
        this._userData[nickname] = {
            id: id,
            hash: '',
            timewatch: timewatch,
            watching: false,
            category: '',
            videosWatched: [],
            categoriesWatched: [],
            prPoints: prPoints,
            maxViews: maxViews
        }
    }

    checkHash(hash) {
        const nicknames = Object.keys(this._userData)
        const res = nicknames.filter(nickname => this._userData[nickname].watching && this._userData[nickname].hash === hash)
        if (res.length > 1) return false
        return true
    }

    #increaseViews(nickname) {
        const currVideoId = this._userData[nickname].videosWatched.slice(-1)[0]
        const currCategory = this._userData[nickname].categoriesWatched.slice(-1)[0]
        this._videos[currCategory].filter(v => v.id === currVideoId)[0].viewsCount += 1
    }

    watchVideo(duration, nickname) {
        const mins = duration / 60
        const timewatch = mins / TW_STANDART
        this._userData[nickname].timewatch += timewatch
        this._userData[nickname].watching = false
        this.#increaseViews(nickname)
    }

    #chooseCategory(nickname) {
        const watchedCategories = this._userData[nickname].categoriesWatched.slice()
        const allowedCategories = this._probCategories.filter(c => !watchedCategories.includes(c.name))
        if (!allowedCategories.length) {
            this._userData[nickname]['category'] = ''
            return
        }
        const categoryName = propabilityWheel(allowedCategories)
        this._userData[nickname]['category'] = categoryName
        this._userData[nickname].categoriesWatched.push(categoryName)
    }

    chooseVideo(nickname, hash) {
        if (!this._userData[nickname].category) this.#chooseCategory(nickname)
        const category = this._userData[nickname].category
        if (!category) return null
        const watchedVideos = this._userData[nickname].videosWatched.slice()
        const allowedVideos = this._videos[category].filter(v => !watchedVideos.includes(v.id))
        if (!allowedVideos.length) {
            this.#chooseCategory(nickname)
            if (!this._userData[nickname].category) return null
            return this.chooseVideo(nickname)
        }
        const randomVideo = allowedVideos[Math.floor(Math.random()*allowedVideos.length)]
        this._userData[nickname].videosWatched.push(randomVideo.id)
        this._userData[nickname].watching = true
        this._userData[nickname].hash = hash
        return randomVideo
    }

    checkUser(nickname) {
        return !!this._userData[nickname]
    }
    isActive() {
        return this._active
    }
    isInView(category, id) {
        category = category.toLowerCase().split(' ')[0]
        if (!this._videos[category]) return false
        return !!this._videos[category].filter(v => v.id === id).length
    }
    isWatching(nickname) {
        return this._userData[nickname].watching
    }

    async #runCycle() {
        this.#setActive(false)
        console.log('start build cycle')

        this.#clearVideos()

        this.#setNames()
        if (!this._names.length) {
            this.#setActive(true)
            console.log('end build cycle')
            return
        }
        await this.#setUserVideos()

        this.#makeProbNames()
        this.#addVideos()
        this.#makeProbCategories()
        this.#clearCache()

        setTimeout(() => {
            this.#setActive(true)
            console.log('end build cycle')
        }, 100 * VIDEO_NUMBER)
    }

    run() {
        let date
        console.log('WatchpointStore is running')
        setInterval(() => {
            date = new Date()
            console.log(date.getHours(), date.getMinutes())
            if (date.getHours() % CYCLE_TIME === 0 && date.getMinutes() === 0) {
                this.#runCycle()
            }
        }, CHECK_INTERVAL)
    }

}


module.exports = new ViewpointsStore()
