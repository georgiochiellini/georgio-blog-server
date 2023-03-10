require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const router = require('./routes/index')
const cors = require('cors')
const PORT = process.env.PORT || 5000
const http = require('http')
const Fingerprint = require('express-fingerprint')
const useragent = require('express-useragent')
const viewpoitsStore = require('./stores/viewpoitsStore')
const url = require('./utils/url')
const requestMiddleware = require('./middlewares/requestMiddleware')

const app = express()

app.use(cors({origin: url.URL}))
app.use(express.json({}))
app.use(Fingerprint())
app.use(useragent.express())
app.use('/api', requestMiddleware, router)

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