
function timeConvert(time) {
    const m = parseInt(Math.floor(time / 60))
    const s = time - m * 60
    return `${m}m${s}s`
}

module.exports = {timeConvert}