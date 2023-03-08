const Router = require('express')
const router = new Router()
const authMiddleware = require('../middlewares/authMiddleware')
const videoController = require('../controllers/videoController')

router.post('/upload', authMiddleware, videoController.uploadVideo)
router.delete('/remove', authMiddleware, videoController.removeVideo)
router.put('/watch', authMiddleware, videoController.watched)
router.put('/get-watch', authMiddleware, videoController.getWatch)
router.get('/', authMiddleware, videoController.getVideos)
router.get('/active', videoController.getActive)
router.get('/store', videoController.getStore)
router.get('/time', authMiddleware, videoController.getWatchTime)
router.put('/active', authMiddleware, videoController.toggleActive)

router.get('/test', videoController.test)


module.exports = router