
// arr = array of objects
// {name: 'name', value: value}

const propabilityWheel = (arr) => {
    const wheel = arr.map((a, i) => {
      return arr.slice(0, i+1).map(b => b.value).reduce((partialSum, a) => partialSum + a, 0)
    })
    const randNum = Math.random() * wheel.slice(-1)[0]
    for (let i=0; i<=wheel.length; i++) {
      if (wheel[i] > randNum) return arr[i].name
    }
}

module.exports = {propabilityWheel}