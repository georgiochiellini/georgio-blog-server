
const statuses = {
    basic: [
        {prp: 100, tw: 0.015, maxViews: 200}
    ],
    pro: [
        {prp: 200, tw: 0.05, maxViews: 500},
        {prp: 500, tw: 0.1, maxViews: 1000},
        {prp: 1000, tw: 0.2, maxViews: 2200},
        {prp: 2200, tw: 0.5, maxViews: 5500},
        {prp: 5500, tw: 0.85, maxViews: 7500},
    ],
    vip: [
        {prp: 1000, tw: 0.2, maxViews: 10000},
        {prp: 5000, tw: 0.5, maxViews: 10000},
        {prp: 10000, tw: 0.85, maxViews: 10000},
    ]
}

const calcStatus = (count) => {
    if (count <= 10) return {status: 'pro', level: 2}
    else if (count <= 100) return {status: 'pro', level: 1}
    else if (count <= 1000) return {status: 'pro', level: 0}
    else return {status: 'basic', level: 0}
}

module.exports = {statuses, calcStatus}
