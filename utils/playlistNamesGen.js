
const topPhrase = ['Top 10 ', 'Top ten ', 'Best 10 ', 'Best ten ', 'The best ', 'Best ']

const firstPhrase = [
    "funny", "cheerful", "contented", "delighted", "elated", "glad", "jubilant", "overjoyed", "pleased", "thrilled",
    "exultant", "blissful", "joyful", "beatific", "calm", "carefree", "comfortable", "composed", "fortunate", "fulfilled", "gratified",
    "optimistic", "peaceful", "satisfied", "serene", "tranquil", "blithe", "buoyant", "carefree", "exhilarated", "gladsome",
    "merry", "over the moon", "rapturous", "sunny", "upbeat", "blissed out", "euphoric", "gleeful", "gratified", "jovial", "joyous",
    "tickled pink", "animated", "auspicious", "blooming", "bright", "chipper", "convivial", "exuberant", "heartening", "jocund",
    "laughing", "mirthful", "perky", "playful", "sprightly", "vibrant", "zestful", "affable", "amicable", "congenial", "friendly",
    "heartwarming", "hospitable", "kind", "nice", "pleasant", "sociable", "agreeable", "blessed", "enjoyable", "favorable", "felicitous",
    "fine", "heartfelt", "lovely", "propitious", "rejoicing", "soulful", "warm", "advantageous", "agreeable", "amicable", "auspicious",
    "bountiful", "congenial", "fortunate", "kindly", "laudable", "lucky", "opportune", "promising", "acceptable", "appreciative",
    "commendable", "congratulatory", "encouraging", "grateful", "hearty", "honest", "humorous", "laudatory", "notable", "promising",
    "sympathetic", "welcome", "acceptable", "appreciative", "congratulatory", "encouraging", "grateful", "hearty", "honest", "humorous",
    "laudatory", "notable", "promising", "sympathetic", "welcome", "lighthearted", "genial"
]

const secondPhrase = [
    " videos that will make your day more enjoyable",
    " videos that will improve your day",
    " videos that will bring a smile to your face",
    " videos that will lift your mood",
    " videos that will make you feel better",
    " videos that will put a smile on your face",
    " videos that will make your day brighter",
    " videos that will make your day happier",
    " videos that will make your day more cheerful",
    " videos that will help you feel better"
]

function generateName() {
    const result = topPhrase[Math.floor(Math.random()*topPhrase.length)] + 
        firstPhrase[Math.floor(Math.random()*firstPhrase.length)] +
        secondPhrase[Math.floor(Math.random()*secondPhrase.length)]
    return result
}

module.exports = { generateName }