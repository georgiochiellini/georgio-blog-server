const bcrypt = require('bcrypt')
const {User} = require('../models')
const emailStore = require('../stores/emailStore')
const nodemailer = require('nodemailer')
// const browser = require('browser')
const jwt = require('jsonwebtoken')
const { statuses, calcStatus } = require('../utils/statuses')

function checkNickname(nickname) {
    let isLegit = true
    let regExsp =  /^[A-Za-z]([A-Za-z0-9_]+)$/g
    isLegit =  nickname.match(regExsp) ? isLegit : false
    isLegit = nickname.length > 16 || nickname.length < 4 ? false : isLegit
    return isLegit
}
const generateJwt = (id, username) => {
    return jwt.sign(
        {id, username},
        process.env.SECRET_KEY,
        {expiresIn: '48h'}
    )
}
function generateNumber(digitCount) {
    let number = []
    for (let i=0; i < digitCount; i++) {
        number.push(parseInt(Math.floor(Math.random()*10)))
    }
    return number.join('')
}
function generateCode(size) {
    let symbols = []
    const upper = String.fromCharCode(...Array.from({ length: 90 - 65 + 1 }, (_, i) => i + 65))
    const lower = String.fromCharCode(...Array.from({ length: 122 - 97 + 1 }, (_, i) => i + 97))
    const allCases = [...lower, ...upper]
    for (let i=0; i < size; i++) {
        symbols.push(allCases[parseInt(Math.floor(Math.random()*allCases.length))])
    }
    return symbols.join('')
}
async function getStatus() {
    const count = await User.count()
    return calcStatus(count)
}

class UserController {

    async registration(req, res, next) {
        const {username, password, email, code, ref} = req.body
        if (!checkNickname(username)) {
            return res.status(400).json({message: `Invalid username`})
        }
        if (password.trim().length < 8) {
            return res.status(400).json({message: 'Password must contain at least 8 characters'})
        }
        let candidate = await User.findOne({username})
        if (!!candidate) {
            return res.status(400).json({message: `User ${username} has already exist`})
        }
        candidate = await User.findOne({email})
        if (!!candidate || emailStore.getCode(email) !== code) {
            return res.status(400).json({message: `Invalid email or code`})
        }
        emailStore.removeData(email)
        if (!!ref) {
            const refUser = await User.findOne({referral: ref})
            if (refUser) await refUser.updateOne({rfp: refUser.rfp + 2})
        }
        const hashPassword = await bcrypt.hash(password, 5)
        const referral = generateCode(12)
        const statusInfo = await getStatus()
        const user = new User({username, password: hashPassword, status: statusInfo.status, email,
            prp: statuses[statusInfo.status][statusInfo.level].prp, rfp: 0, level: statusInfo.level, referral})
        await user.save()
        const token = generateJwt(user.id, user.username)
        return res.json({token, user})
    }

    async login(req, res, next) {
        const {username, password, email, code} = req.body
        const user = await User.findOne({username})
        if (!user) {
            return res.status(400).json({message: `User ${username} does not exist`})
        }
        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword && !code) {
            return res.status(400).json({message: `Incorrect password`})
        }
        if (!!code) {
            if (emailStore.getCode(email) !== code || user.email !== email) {
                return res.status(400).json({message: `Invalid email or code`})
            }
            emailStore.removeData(email)
        }
        const token = generateJwt(user.id, user.username)
        return res.json({token, user})
    }

    async check(req, res, next) {
        const user = await User.findOne({_id: req.user.id})
        const token = generateJwt(user.id, user.username)
        return res.json({token, user})
    }

    async sendEmail(req, res, next) {
        const {email} = req.body
        const emailCode = generateNumber(8)
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {user: emailStore.email, pass: emailStore.password}
        })
        const mailConfigs = {
            from: emailStore.email, to: email,
            subject: 'WatchMachine confirmation code',
            text: `${emailCode}`
        }
        transporter.sendMail(mailConfigs, function (error, info) {
            if (error) {
                return res.status(400).json({message: 'Invalid email'})
            }
            emailStore.pushData(email, emailCode)
            return res.status(200).json({message: 'Email sent successfully'})
        })
    }

    async edit(req, res, next) {
        const {username, password, email, code} = req.body
        const user = req.user

        if (!email || !code) return res.status(400).json({message: `Email and code fields are required`})
        if (!username && !password) return res.status(400).json({message: `Fill in the fields you want to change`})

        const userModel = await User.findOne({username: user.username})
        if (emailStore.getCode(email) !== code || userModel.email !== email) {
            return res.status(400).json({message: `Invalid email or code`})
        }
        emailStore.removeData(email)

        if (!!username) {
            if (!checkNickname(username)) {
                return res.status(400).json({message: `Invalid username`})
            }
            const candidate = await User.findOne({username})
            if (candidate) {
                return res.status(400).json({message: `User ${username} has already exist`})
            }
            await userModel.updateOne({username})
        }
        if (!!password) {
            const hashPassword = await bcrypt.hash(password, 5)
            await userModel.updateOne({password: hashPassword})
        }

        return res.status(200).json({message: `User ${username} was successfully edited`})
    }

    async getReferralLink(req, res, next) {
        const user = req.user
        const userModel = await User.findOne({_id: user.id})
        return res.status(200).json({referral: userModel.referral})
    }

}

module.exports = new UserController()