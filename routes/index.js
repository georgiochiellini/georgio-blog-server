const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter')
const videoRouter = require('./videoRouter')

router.use('/user', userRouter)
router.use('/video', videoRouter)

module.exports = router
