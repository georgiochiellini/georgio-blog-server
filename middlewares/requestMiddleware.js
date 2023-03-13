const url = require("../utils/url")

module.exports = function(req, res, next) {
    if (req.method === "OPTIONS") {
        next()
    }
    const isAllowedOrigin = req.header('Origin') === url.URL && !req.useragent.isBot
    
    if (!isAllowedOrigin) return res.status(403).json({message: 'Forbidden'})
    else return next()
}