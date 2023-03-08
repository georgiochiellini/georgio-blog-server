const Router = require('express')
const router = new Router()
const authMiddleware = require('../middlewares/authMiddleware')
const userController = require('../controllers/userController')

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.put('/email', userController.sendEmail)
router.get('/auth', authMiddleware, userController.check)
router.put('/', authMiddleware, userController.edit)
router.get('/ref', authMiddleware, userController.getReferralLink)


module.exports = router