require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const router = require('./routes/index')
const cors = require('cors')
const PORT = process.env.PORT || 5000
const http = require('http')
const path = require('path')
const Fingerprint = require('express-fingerprint')
const viewpoitsStore = require('./stores/viewpoitsStore')

const app = express()

app.set('trust proxy', true)

app.use(cors({origin: 'https://watchmachine-promoting.onrender.com'}))
app.use(express.json({}))
app.use(Fingerprint())
app.use('/api', router)

const server = http.createServer(app)

const start = async () => {
    try {
        mongoose.set('strictQuery', true)
            .connect(process.env.MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
            .then(() => console.log('MongoDB was connected successfully'))
            .catch((e) => console.log(e))
        server.listen(PORT, () => console.log(`Server starts on port ${PORT}`))
        viewpoitsStore.run()
    } catch(e) {
        console.log(e)
    }
}

start()