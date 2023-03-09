const url = require("../utils/url")

module.exports = function(req, res, next) {
    if (req.method === "OPTIONS") {
        next()
    }
    const isAllowedOrigin = req.header('Origin') === url.URL && !req.useragent.isBot
    const isAllowedDevice = req.useragent.isDesktop
    
    if (!isAllowedOrigin) return res.status(403).json({message: 'Forbidden'})
    else if (!isAllowedDevice) return res.status(400).json({message: 'Forbidden for mobile users'})
    else return next()
}