
const type = 'production'

const url = {
    developing: 'http://localhost:3000',
    production: 'https://watchmachine-promoting.onrender.com'
}

module.exports = {URL: url[type]}