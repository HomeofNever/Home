const got = require('got')
let data = []

async function random() {
    if (data.length === 0) {
        response = await got('https://gist.githubusercontent.com/NeverBehave/606d7e14436187b4d45e8657fafd40ab/raw/6906e651b8b356dc5a7aa5cf32eefb6c875306d1/sao.txt')
        data = JSON.parse(response.body)
    }
    return Promise.resolve(data[Math.floor(Math.random() * data.length)])
}

module.exports = async (req, res) => {
    console.log(req)
    res.end(await random())
}
