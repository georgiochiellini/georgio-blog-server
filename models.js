const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: { type: String, required: true  },
    password: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, required: true },
    referral: { type: String, required: true },
    prp: { type: Number, required: true }, // premium points
    rfp: { type: Number, required: true }, // referral points
    level: { type: Number, required: true },
}, {timestamps: true})

const videoSchema = new Schema({
    name: { type: String, required: true },
    videoId: { type: String, required: true },
    playlistId: { type: String, required: true },
    url: { type: String, required: true },
    userId: { type: Object, required: true },
    duration: { type: Number, required: true },
    prevDuration: { type: Number, required: true },
    prevVideoId: { type: String, required: true },
    channelName: { type: String, required: true },
    photo: { type: String, required: true },
    category: { type: String, required: true },
    active: { type: Boolean, required: true }
}, {timestamps: true})

const User = mongoose.model('User', userSchema)
const Video = mongoose.model('Video', videoSchema)

module.exports = { User, Video }