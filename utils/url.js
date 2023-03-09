
const type = 'production'

const url = {
    developing: 'http://localhost:3000',
    production: 'https://watch-machine.onrender.com'
}

module.exports = {URL: url[type]}